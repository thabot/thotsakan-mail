import type { Database } from 'bun:sqlite';
import { EmailLogRepository } from '../database/repositories/email-log.repository.js';
import { AccountRepository } from '../database/repositories/account.repository.js';
import { EmailProviderFactory } from '../providers/factory.js';
import { RateLimitService } from '../services/rate-limit.service.js';
import { FailoverService } from '../services/failover.service.js';
import { DeadLetterService } from '../services/dead-letter.service.js';
import { SentboxCleanerService } from '../services/sentbox-cleaner.service.js';
import { TemplateEngineService } from '../services/template-engine.service.js';
import { CryptoService } from '../services/crypto.service.js';
import { TokenManagerService } from '../services/token-manager.service.js';
import { getEnv } from '../config/env.js';
import type { EmailMessage } from '../core/types/email.types.js';

export interface QueueWorkerOptions {
  pollingIntervalMs?: number;
  batchSize?: number;
}

export class QueueWorker {
  private logRepo: EmailLogRepository;
  private accountRepo: AccountRepository;
  private rateLimitService: RateLimitService;
  private failoverService: FailoverService;
  private deadLetterService: DeadLetterService;
  private sentboxCleaner: SentboxCleanerService;
  private templateEngine: TemplateEngineService;
  private crypto: CryptoService;
  private tokenManager: TokenManagerService;
  private isRunning: boolean = false;
  private timer: any = null;

  constructor(private db: Database, private options: QueueWorkerOptions = {}) {
    this.logRepo = new EmailLogRepository(db);
    this.accountRepo = new AccountRepository(db);
    this.rateLimitService = new RateLimitService(db);
    this.failoverService = new FailoverService(db);
    this.deadLetterService = new DeadLetterService();
    this.sentboxCleaner = new SentboxCleanerService();
    this.templateEngine = new TemplateEngineService(db);
    this.crypto = new CryptoService(getEnv().ENCRYPTION_KEY);
    this.tokenManager = new TokenManagerService(this.accountRepo, this.crypto);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const interval = this.options.pollingIntervalMs || 1000;
    this.timer = setInterval(() => this.processNextBatch(), interval);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async processNextBatch(): Promise<number> {
    let processed = 0;
    const limit = this.options.batchSize || 10;

    while (processed < limit) {
      const job = this.logRepo.fetchNextJobForProcessing();
      if (!job) break;

      await this.processJob(job);
      processed++;
    }

    return processed;
  }

  public async processJob(job: any): Promise<void> {
    const recipients: string[] = typeof job.to_recipients === 'string'
      ? JSON.parse(job.to_recipients)
      : job.to_recipients;

    // Restore original EmailMessage payload or fallback to basic reconstruction
    let message: EmailMessage;
    if (job.message_payload) {
      try {
        message = typeof job.message_payload === 'string'
          ? JSON.parse(job.message_payload)
          : job.message_payload;
      } catch {
        message = { to: recipients, subject: job.subject, saveToSentItems: !!job.save_to_sent_items };
      }
    } else {
      message = { to: recipients, subject: job.subject, saveToSentItems: !!job.save_to_sent_items };
    }

    // Resolve template if needed
    const tplCode = message.templateCode || message.templateId;
    if (tplCode && (!message.html || !message.subject || message.subject === '(No Subject)')) {
      const rendered = this.templateEngine.renderByCode(job.tenant_id, tplCode, message.templateData || {});
      if (rendered) {
        if (!message.subject || message.subject === '(No Subject)') message.subject = rendered.subject;
        if (!message.html) message.html = rendered.html;
        if (!message.text && rendered.text) message.text = rendered.text;
      }
    }

    // Resolve initial account
    let accountId = job.account_id;
    let account = accountId ? this.accountRepo.findById(accountId) : null;

    // If no account assigned, pick first active account for tenant
    if (!account) {
      const tenantAccounts = this.accountRepo.findByTenantId(job.tenant_id);
      account = tenantAccounts.length > 0 ? tenantAccounts[0] : null;
      accountId = account?.id;
    }

    if (!account) {
      this.logRepo.markFailed(job.job_id, 'No active email account available for tenant', undefined, true);
      const alert = this.deadLetterService.buildAlertPayload({ ...job, error_details: 'No active email account' });
      await this.deadLetterService.notify(alert);
      return;
    }

    // Attempt dispatch with failover loop
    const triedAccountIds: string[] = [];
    let currentAccount = account;
    let dispatchSuccess = false;
    let lastError = '';

    while (currentAccount && !dispatchSuccess) {
      triedAccountIds.push(currentAccount.id);

      // Check Rate Limiter
      const rateLimitStatus = this.rateLimitService.checkRateLimit(currentAccount.id);
      if (!rateLimitStatus.allowed) {
        // Account throttled, try fallback or delay job
        const fallback = this.failoverService.getFallbackAccount(currentAccount.id, triedAccountIds);
        if (fallback) {
          currentAccount = fallback;
          continue;
        } else {
          // No fallback available, reschedule with retry delay
          const retryDelaySec = rateLimitStatus.retryAfterSeconds || 60;
          const nextScheduledAt = new Date(Date.now() + retryDelaySec * 1000).toISOString();
          this.logRepo.markFailed(job.job_id, rateLimitStatus.reason || 'Rate limit exceeded', nextScheduledAt, false);
          return;
        }
      }

      // Decrypt credentials
      let credentials: any;
      try {
        const decryptedJson = this.crypto.decrypt(currentAccount.credentials);
        credentials = JSON.parse(decryptedJson);
      } catch (err: any) {
        lastError = `Failed to decrypt credentials for account ${currentAccount.id}: ${err.message}`;
        currentAccount = this.failoverService.getFallbackAccount(currentAccount.id, triedAccountIds);
        continue;
      }

      // Autonomous Token Refresh for OAuth2 providers (ms-graph, gmail)
      if (
        (currentAccount.provider_type === 'ms-graph' || currentAccount.provider_type === 'gmail') &&
        (!credentials.apiKey || credentials.tenantId || credentials.refreshToken)
      ) {
        try {
          const freshToken = await this.tokenManager.getOrRefreshToken(currentAccount.id);
          credentials.apiKey = freshToken;
        } catch (tokenErr: any) {
          lastError = `Autonomous Token Refresh failed for account ${currentAccount.id}: ${tokenErr.message}`;
          currentAccount = this.failoverService.getFallbackAccount(currentAccount.id, triedAccountIds);
          continue;
        }
      }

      // Send via Provider Adapter
      try {
        const provider = EmailProviderFactory.getProvider(currentAccount.provider_type);
        const result = await provider.send(message, credentials);

        if (result.success) {
          dispatchSuccess = true;
          this.rateLimitService.recordUsage(currentAccount.id);
          this.logRepo.markSent(job.job_id, currentAccount.provider_type, result.messageId);

          // Purge sentbox if saveToSentItems is false
          if (!job.save_to_sent_items && result.messageId) {
            try {
              await this.sentboxCleaner.clean(
                currentAccount.provider_type,
                result.messageId,
                credentials
              );
            } catch (cleanErr: any) {
              console.warn(`[QueueWorker] Sentbox purge failed for job ${job.job_id}:`, cleanErr.message);
            }
          }
          return;
        } else {
          lastError = result.error || 'Provider returned unsuccessful response';
          // Check if error warrants immediate failover to another account
          if (this.failoverService.shouldFailover(result.statusCode, result.error)) {
            currentAccount = this.failoverService.getFallbackAccount(currentAccount.id, triedAccountIds);
          } else {
            break; // Non-transient error (e.g. invalid payload)
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Dispatch exception';
        if (this.failoverService.shouldFailover(undefined, err.message)) {
          currentAccount = this.failoverService.getFallbackAccount(currentAccount.id, triedAccountIds);
        } else {
          break;
        }
      }
    }

    // If dispatch failed across attempts
    const attempts = job.attempts; // already incremented when fetched
    const maxAttempts = job.max_attempts || 3;

    if (attempts >= maxAttempts) {
      // Final Failure -> Dead-Letter
      this.logRepo.markFailed(job.job_id, lastError, undefined, true);
      const alert = this.deadLetterService.buildAlertPayload({
        ...job,
        attempts,
        max_attempts: maxAttempts,
        error_details: lastError,
      });
      await this.deadLetterService.notify(alert);
    } else {
      // Exponential Backoff Retry: 15 * 2^attempts + jitter
      const jitter = Math.floor(Math.random() * 5);
      const backoffSec = 15 * Math.pow(2, attempts) + jitter;
      const nextScheduledAt = new Date(Date.now() + backoffSec * 1000).toISOString();
      this.logRepo.markFailed(job.job_id, lastError, nextScheduledAt, false);
    }
  }

  /**
   * Helper to calculate exponential backoff delay seconds
   */
  public static calculateBackoff(attempts: number): number {
    const jitter = Math.floor(Math.random() * 5);
    return 15 * Math.pow(2, attempts) + jitter;
  }
}
