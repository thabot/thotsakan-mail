import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { AccountRepository } from '../../src/database/repositories/account.repository.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';
import { SuppressionRepository } from '../../src/database/repositories/suppression.repository.js';
import { IdempotencyRepository } from '../../src/database/repositories/idempotency.repository.js';
import { EmailLogRepository } from '../../src/database/repositories/email-log.repository.js';

describe('Database & Repositories (SQLite WAL)', () => {
  const db = createTestDatabase();

  it('should have foreign keys enabled', () => {
    const row: any = db.prepare('PRAGMA foreign_keys;').get();
    expect(row.foreign_keys).toBe(1);
  });

  it('should perform CRUD operations on Email Accounts', () => {
    const repo = new AccountRepository(db);
    repo.create({
      id: 'acc_01',
      tenantId: 'tenant_main',
      name: 'Primary SES',
      providerType: 'aws-ses',
      encryptedCredentials: 'enc_cred_string',
      fromEmail: 'noreply@example.com',
      dailyQuotaLimit: 5000,
      rateLimitPerMinute: 60,
    });

    const account = repo.findById('acc_01');
    expect(account).not.toBeNull();
    expect(account.from_email).toBe('noreply@example.com');
    expect(account.daily_quota_used).toBe(0);

    repo.incrementDailyUsage('acc_01');
    expect(repo.findById('acc_01').daily_quota_used).toBe(1);

    repo.resetDailyUsage('acc_01');
    expect(repo.findById('acc_01').daily_quota_used).toBe(0);
  });

  it('should manage suppression list properly', () => {
    const repo = new SuppressionRepository(db);
    expect(repo.isSuppressed('spammer@bad.com', 'tenant_main')).toBe(false);

    repo.add('spammer@bad.com', 'tenant_main', 'SPAM');
    expect(repo.isSuppressed('spammer@bad.com', 'tenant_main')).toBe(true);
    expect(repo.isSuppressed('SPAMMER@BAD.COM', 'tenant_main')).toBe(true); // case insensitive check

    repo.remove('spammer@bad.com', 'tenant_main');
    expect(repo.isSuppressed('spammer@bad.com', 'tenant_main')).toBe(false);
  });

  it('should save and retrieve idempotency responses', () => {
    const repo = new IdempotencyRepository(db);
    repo.save('idem_key_123', 'tenant_main', 202, JSON.stringify({ jobId: 'job_1' }), 24);

    const cached = repo.get('idem_key_123', 'tenant_main');
    expect(cached).not.toBeNull();
    expect(cached?.status).toBe(202);
    expect(JSON.parse(cached!.body).jobId).toBe('job_1');

    expect(repo.get('unknown_key', 'tenant_main')).toBeNull();
  });

  it('should handle priority queue job fetching and status updates', () => {
    const repo = new EmailLogRepository(db);
    repo.create({
      jobId: 'job_low',
      tenantId: 'tenant_main',
      toRecipients: ['user1@test.com'],
      subject: 'Newsletter',
      priority: 'low',
    });

    repo.create({
      jobId: 'job_high',
      tenantId: 'tenant_main',
      toRecipients: ['user2@test.com'],
      subject: 'OTP Security Code',
      priority: 'high',
    });

    // High priority job must be dequeued first
    const nextJob = repo.fetchNextJobForProcessing();
    expect(nextJob).not.toBeNull();
    expect(nextJob.job_id).toBe('job_high');
    expect(nextJob.status).toBe('PROCESSING');

    repo.markSent('job_high', 'aws-ses', 'msg_id_999');
    const updated = repo.findById('job_high');
    expect(updated.status).toBe('SENT');
    expect(updated.provider_used).toBe('aws-ses');
  });
});
