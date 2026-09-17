import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Database } from 'bun:sqlite';
import { EmailLogRepository } from '../../database/repositories/email-log.repository.js';
import { AccountRepository } from '../../database/repositories/account.repository.js';
import { RoutingRuleRepository } from '../../database/repositories/rule.repository.js';
import { SuppressionService } from '../../services/suppression.service.js';
import { RuleEngineService } from '../../services/rule-engine.service.js';
import { RateLimitService } from '../../services/rate-limit.service.js';
import { FailoverService } from '../../services/failover.service.js';
import { CryptoService } from '../../services/crypto.service.js';
import { EmailProviderFactory } from '../../providers/factory.js';
import { SentboxCleanerService } from '../../services/sentbox-cleaner.service.js';
import { AttachmentGuardService } from '../../services/attachment-guard.service.js';
import { TemplateEngineService } from '../../services/template-engine.service.js';
import { getEnv } from '../../config/env.js';
import type { EmailMessage, EmailPriority } from '../../core/types/email.types.js';

type EmailEnv = {
  Variables: {
    tenantId: string;
    apiKeyId: string;
  };
};

// Request Validation Schemas
const AttachmentSchema = z.object({
  filename: z.string(),
  content: z.string(),
  contentType: z.string().optional(),
  disposition: z.enum(['attachment', 'inline']).optional(),
  cid: z.string().optional(),
});

const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  from: z.string().optional(),
  replyTo: z.string().email().optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  templateId: z.string().optional(),
  templateCode: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  headers: z.record(z.string()).optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  scheduledAt: z.string().optional(),
  delaySeconds: z.number().nonnegative().optional(),
  saveToSentItems: z.boolean().default(false),
  async: z.boolean().default(true),
  accountId: z.string().optional(),
});

const BatchEmailSchema = z.object({
  emails: z.array(SendEmailSchema).min(1).max(500),
});

const CreateAccountSchema = z.object({
  name: z.string().min(1),
  providerType: z.string(),
  credentials: z.record(z.any()),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  dailyQuotaLimit: z.number().int().positive().default(10000),
  rateLimitPerMinute: z.number().int().positive().default(60),
  fallbackAccountId: z.string().optional(),
});

const CreateRuleSchema = z.object({
  priority: z.number().int().default(0),
  conditionType: z.enum(['domain_match', 'subject_contains', 'recipient_regex']),
  conditionValue: z.string().min(1),
  targetAccountId: z.string().min(1),
  isActive: z.boolean().default(true),
});

const SuppressionSchema = z.object({
  email: z.string().email(),
  reason: z.enum(['BOUNCE', 'SPAM', 'MANUAL', 'UNSUBSCRIBE']).default('MANUAL'),
});

export function createEmailsRoute(db: Database) {
  const app = new Hono<EmailEnv>();
  const logRepo = new EmailLogRepository(db);
  const accountRepo = new AccountRepository(db);
  const ruleRepo = new RoutingRuleRepository(db);
  const suppressionService = new SuppressionService(db);
  const ruleEngine = new RuleEngineService(db);
  const rateLimitService = new RateLimitService(db);
  const failoverService = new FailoverService(db);
  const sentboxCleaner = new SentboxCleanerService();
  const templateEngine = new TemplateEngineService(db);
  const crypto = new CryptoService(getEnv().ENCRYPTION_KEY);

  // 1. POST /v1/emails/send
  app.post('/v1/emails/send', zValidator('json', SendEmailSchema), async (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const body = c.req.valid('json');

    // Resolve template if templateCode or templateId provided
    const tplCode = body.templateCode || body.templateId;
    if (tplCode) {
      const rendered = templateEngine.renderByCode(tenantId, tplCode, body.templateData || {});
      if (rendered) {
        if (!body.subject && rendered.subject) body.subject = rendered.subject;
        if (!body.html && rendered.html) body.html = rendered.html;
        if (!body.text && rendered.text) body.text = rendered.text;
      }
    }

    if (!body.subject) {
      body.subject = '(No Subject)';
    }

    const recipients = Array.isArray(body.to) ? body.to : [body.to];

    // Check Suppression List
    const suppCheck = suppressionService.checkSuppression(recipients, tenantId);
    if (suppCheck.isSuppressed) {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      logRepo.create({
        jobId,
        tenantId,
        toRecipients: recipients,
        subject: body.subject,
        priority: body.priority as EmailPriority,
      });
      logRepo.markSuppressed(jobId, `Recipient ${suppCheck.suppressedEmail} is in suppression list`);

      return c.json({
        ok: false,
        jobId,
        status: 'SUPPRESSED',
        error: `Recipient ${suppCheck.suppressedEmail} is suppressed`,
      }, 400);
    }

    // Validate Attachments
    if (body.attachments && body.attachments.length > 0) {
      const guardResult = AttachmentGuardService.validate(body.attachments as any);
      if (!guardResult.valid) {
        return c.json({ ok: false, error: guardResult.error }, 400);
      }
    }

    // Determine target account via explicit parameter, dynamic rules, or fallback
    let targetAccountId = body.accountId;
    if (!targetAccountId) {
      targetAccountId = ruleEngine.matchAccount(body as any, tenantId) || undefined;
    }

    // Calculate scheduledAt if delaySeconds was provided
    let scheduledAt = body.scheduledAt;
    if (body.delaySeconds && body.delaySeconds > 0) {
      scheduledAt = new Date(Date.now() + body.delaySeconds * 1000).toISOString();
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // ASYNC MODE (Fast Enqueue < 5ms)
    if (body.async) {
      logRepo.create({
        jobId,
        tenantId,
        accountId: targetAccountId,
        toRecipients: recipients,
        subject: body.subject,
        priority: body.priority as EmailPriority,
        scheduledAt,
        saveToSentItems: body.saveToSentItems,
        isSync: false,
        messagePayload: body,
      });

      return c.json({
        ok: true,
        jobId,
        status: 'ACCEPTED',
        priority: body.priority,
        scheduledAt: scheduledAt || new Date().toISOString(),
      }, 202);
    }

    // SYNC MODE (Immediate Send e.g. for OTP)
    logRepo.create({
      jobId,
      tenantId,
      accountId: targetAccountId,
      toRecipients: recipients,
      subject: body.subject,
      priority: 'high',
      isSync: true,
      saveToSentItems: body.saveToSentItems,
      messagePayload: body,
    });

    // Execute Immediate Dispatch
    let account = targetAccountId ? accountRepo.findById(targetAccountId) : null;
    if (!account) {
      const active = accountRepo.findByTenantId(tenantId);
      account = active.length > 0 ? active[0] : null;
    }

    if (!account) {
      logRepo.markFailed(jobId, 'No active email account configured', undefined, true);
      return c.json({ ok: false, jobId, status: 'FAILED', error: 'No active email account' }, 500);
    }

    const triedAccounts: string[] = [];
    let currentAccount = account;
    let dispatchSuccess = false;
    let lastError = '';

    while (currentAccount && !dispatchSuccess) {
      triedAccounts.push(currentAccount.id);

      const rateLimitStatus = rateLimitService.checkRateLimit(currentAccount.id);
      if (!rateLimitStatus.allowed) {
        const fallback = failoverService.getFallbackAccount(currentAccount.id, triedAccounts);
        if (fallback) {
          currentAccount = fallback;
          continue;
        } else {
          lastError = rateLimitStatus.reason || 'Account rate limit reached';
          break;
        }
      }

      let credentials: any;
      try {
        credentials = JSON.parse(crypto.decrypt(currentAccount.credentials));
      } catch (err: any) {
        lastError = `Decryption failed: ${err.message}`;
        currentAccount = failoverService.getFallbackAccount(currentAccount.id, triedAccounts);
        continue;
      }

      try {
        const provider = EmailProviderFactory.getProvider(currentAccount.provider_type);
        const res = await provider.send(body as any, credentials);
        if (res.success) {
          dispatchSuccess = true;
          rateLimitService.recordUsage(currentAccount.id);
          logRepo.markSent(jobId, currentAccount.provider_type, res.messageId);

          if (!body.saveToSentItems && res.messageId) {
            sentboxCleaner.clean(currentAccount.provider_type, res.messageId, credentials).catch(() => {});
          }

          return c.json({
            ok: true,
            jobId,
            status: 'SENT',
            provider: currentAccount.provider_type,
            messageId: res.messageId,
          });
        } else {
          lastError = res.error || 'Provider returned unsuccessful status';
          if (failoverService.shouldFailover(res.statusCode, res.error)) {
            currentAccount = failoverService.getFallbackAccount(currentAccount.id, triedAccounts);
          } else {
            break;
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Dispatch error';
        if (failoverService.shouldFailover(undefined, err.message)) {
          currentAccount = failoverService.getFallbackAccount(currentAccount.id, triedAccounts);
        } else {
          break;
        }
      }
    }

    logRepo.markFailed(jobId, lastError, undefined, true);
    return c.json({
      ok: false,
      jobId,
      status: 'FAILED',
      error: lastError,
    }, 500);
  });

  // 2. POST /v1/emails/batch (Bulk Insert up to 500 emails)
  app.post('/v1/emails/batch', zValidator('json', BatchEmailSchema), async (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const { emails } = c.req.valid('json');

    const jobResults: Array<{ jobId: string; to: string[]; status: string }> = [];

    // SQLite WAL bulk transaction
    const insertTransaction = db.transaction((items: typeof emails) => {
      for (const item of items) {
        const recipients = Array.isArray(item.to) ? item.to : [item.to];
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const tplCode = item.templateCode || item.templateId;
        if (tplCode) {
          const rendered = templateEngine.renderByCode(tenantId, tplCode, item.templateData || {});
          if (rendered) {
            if (!item.subject && rendered.subject) item.subject = rendered.subject;
            if (!item.html && rendered.html) item.html = rendered.html;
            if (!item.text && rendered.text) item.text = rendered.text;
          }
        }

        if (!item.subject) {
          item.subject = '(No Subject)';
        }

        let targetAccountId = item.accountId;
        if (!targetAccountId) {
          targetAccountId = ruleEngine.matchAccount(item as any, tenantId) || undefined;
        }

        let scheduledAt = item.scheduledAt;
        if (item.delaySeconds && item.delaySeconds > 0) {
          scheduledAt = new Date(Date.now() + item.delaySeconds * 1000).toISOString();
        }

        logRepo.create({
          jobId,
          tenantId,
          accountId: targetAccountId,
          toRecipients: recipients,
          subject: item.subject,
          priority: item.priority as EmailPriority,
          scheduledAt,
          saveToSentItems: item.saveToSentItems,
          isSync: false,
          messagePayload: item,
        });

        jobResults.push({ jobId, to: recipients, status: 'ACCEPTED' });
      }
    });

    insertTransaction(emails);

    return c.json({
      ok: true,
      totalEnqueued: jobResults.length,
      jobs: jobResults,
    }, 202);
  });

  // 3. GET /v1/emails/status/:jobId
  app.get('/v1/emails/status/:jobId', (c) => {
    const jobId = c.req.param('jobId');
    const job = logRepo.findById(jobId);
    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }
    return c.json({ ok: true, job });
  });

  // 4. GET /v1/emails/logs
  app.get('/v1/emails/logs', (c) => {
    const tenantId = c.get('tenantId') || c.req.query('tenantId');
    const status = c.req.query('status') as any;
    const recipient = c.req.query('recipient');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    const logs = logRepo.findLogs({ tenantId, status, recipient, limit, offset });
    return c.json({ ok: true, count: logs.length, logs });
  });

  // 5. GET /v1/metrics/overview
  app.get('/v1/metrics/overview', (c) => {
    const tenantId = c.get('tenantId') || c.req.query('tenantId');
    const metrics = logRepo.getOverviewMetrics(tenantId);
    return c.json({ ok: true, metrics });
  });

  // 6. Suppression List CRUD
  app.get('/v1/suppression', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const list = suppressionService.list(tenantId);
    return c.json({ ok: true, list });
  });

  app.post('/v1/suppression', zValidator('json', SuppressionSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const { email, reason } = c.req.valid('json');
    suppressionService.suppress(email, tenantId, reason);
    return c.json({ ok: true, message: `Suppressed ${email}` }, 201);
  });

  app.delete('/v1/suppression/:email', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const email = c.req.param('email');
    suppressionService.unsuppress(email, tenantId);
    return c.json({ ok: true, message: `Unsuppressed ${email}` });
  });

  // 7. Accounts CRUD
  app.get('/v1/accounts', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const accounts = accountRepo.findByTenantId(tenantId);
    // Don't expose encrypted credentials directly
    const sanitized = accounts.map((a: any) => ({
      ...a,
      credentials: '[ENCRYPTED]',
    }));
    return c.json({ ok: true, accounts: sanitized });
  });

  app.post('/v1/accounts', zValidator('json', CreateAccountSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const body = c.req.valid('json');
    const encryptedCredentials = crypto.encrypt(JSON.stringify(body.credentials));

    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    accountRepo.create({
      id: accountId,
      tenantId,
      name: body.name,
      providerType: body.providerType as any,
      encryptedCredentials,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      dailyQuotaLimit: body.dailyQuotaLimit,
      rateLimitPerMinute: body.rateLimitPerMinute,
      fallbackAccountId: body.fallbackAccountId,
    });

    return c.json({ ok: true, accountId, message: 'Account created' }, 201);
  });

  app.delete('/v1/accounts/:id', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const id = c.req.param('id');
    accountRepo.delete(id, tenantId);
    return c.json({ ok: true, message: 'Account deleted' });
  });

  // 8. Routing Rules CRUD
  app.get('/v1/rules', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const rules = ruleRepo.listByTenantId(tenantId);
    return c.json({ ok: true, rules });
  });

  app.post('/v1/rules', zValidator('json', CreateRuleSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const body = c.req.valid('json');
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    ruleRepo.create({
      id: ruleId,
      tenantId,
      priority: body.priority,
      conditionType: body.conditionType,
      conditionValue: body.conditionValue,
      targetAccountId: body.targetAccountId,
      isActive: body.isActive,
    });

    return c.json({ ok: true, ruleId, message: 'Routing rule created' }, 201);
  });

  app.delete('/v1/rules/:id', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const id = c.req.param('id');
    ruleRepo.delete(id, tenantId);
    return c.json({ ok: true, message: 'Routing rule deleted' });
  });

  return app;
}
