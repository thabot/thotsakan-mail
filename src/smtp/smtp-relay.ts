import { createHash } from 'node:crypto';
import type { Database } from 'bun:sqlite';
import { ApiKeyRepository } from '../database/repositories/api-key.repository.js';
import { EmailLogRepository } from '../database/repositories/email-log.repository.js';
import { SuppressionService } from '../services/suppression.service.js';
import { RuleEngineService } from '../services/rule-engine.service.js';

export interface ParsedSmtpMessage {
  from: string;
  to: string[];
  subject: string;
  body: string;
  html?: string;
}

export class SmtpRelayHandler {
  private apiKeyRepo: ApiKeyRepository;
  private logRepo: EmailLogRepository;
  private suppressionService: SuppressionService;
  private ruleEngine: RuleEngineService;

  constructor(private db: Database) {
    this.apiKeyRepo = new ApiKeyRepository(db);
    this.logRepo = new EmailLogRepository(db);
    this.suppressionService = new SuppressionService(db);
    this.ruleEngine = new RuleEngineService(db);
  }

  /**
   * Authenticate SMTP client via API key password
   */
  public authenticate(username: string, apiKey: string): { authenticated: boolean; tenantId?: string } {
    if (!apiKey) return { authenticated: false };

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const tenantKey = this.apiKeyRepo.findByHash(keyHash);

    if (!tenantKey || !tenantKey.is_active) {
      return { authenticated: false };
    }

    return { authenticated: true, tenantId: tenantKey.tenant_id };
  }

  /**
   * Parse raw RFC822 / MIME text into basic fields
   */
  public static parseRawEmail(rawMime: string): ParsedSmtpMessage {
    const lines = rawMime.split(/\r?\n/);
    let isHeader = true;
    let from = '';
    const to: string[] = [];
    let subject = '';
    const bodyLines: string[] = [];

    for (const line of lines) {
      if (isHeader) {
        if (line.trim() === '') {
          isHeader = false;
          continue;
        }

        const lower = line.toLowerCase();
        if (lower.startsWith('from:')) {
          const match = line.substring(5).match(/<([^>]+)>/) || [null, line.substring(5).trim()];
          from = match[1] || line.substring(5).trim();
        } else if (lower.startsWith('to:')) {
          const toStr = line.substring(3);
          const addresses = toStr.split(',').map((addr) => {
            const m = addr.match(/<([^>]+)>/);
            return m ? m[1].trim() : addr.trim();
          });
          to.push(...addresses);
        } else if (lower.startsWith('subject:')) {
          subject = line.substring(8).trim();
        }
      } else {
        bodyLines.push(line);
      }
    }

    const fullBody = bodyLines.join('\n');
    const isHtml = fullBody.includes('<html>') || fullBody.includes('<HTML>') || fullBody.includes('<!DOCTYPE html');

    return {
      from,
      to,
      subject: subject || '(No Subject)',
      body: fullBody,
      html: isHtml ? fullBody : undefined,
    };
  }

  /**
   * Ingest incoming parsed email directly into SQLite priority queue
   */
  public ingest(parsed: ParsedSmtpMessage, tenantId: string): { ok: boolean; jobId?: string; error?: string } {
    if (!parsed.to || parsed.to.length === 0) {
      return { ok: false, error: 'Recipient list is empty' };
    }

    // Check suppression
    const supp = this.suppressionService.checkSuppression(parsed.to, tenantId);
    if (supp.isSuppressed) {
      return { ok: false, error: `Recipient ${supp.suppressedEmail} is suppressed` };
    }

    const targetAccountId = this.ruleEngine.matchAccount(
      { to: parsed.to, subject: parsed.subject } as any,
      tenantId
    ) || undefined;

    const jobId = `smtp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.logRepo.create({
      jobId,
      tenantId,
      accountId: targetAccountId,
      toRecipients: parsed.to,
      subject: parsed.subject,
      priority: 'normal',
      saveToSentItems: false,
      isSync: false,
      messagePayload: {
        to: parsed.to,
        from: parsed.from,
        subject: parsed.subject,
        text: parsed.body,
        html: parsed.html,
      },
    });

    return { ok: true, jobId };
  }
}
