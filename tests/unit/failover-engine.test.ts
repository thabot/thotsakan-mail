import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { FailoverService } from '../../src/services/failover.service.js';

describe('Unit: FailoverService', () => {
  const db = createTestDatabase();
  const failover = new FailoverService(db);

  // Insert fallback account first to satisfy FK constraint
  db.prepare(`
    INSERT INTO email_accounts (
      id, tenant_id, name, provider_type, credentials, from_email,
      daily_quota_limit, daily_quota_used, rate_limit_per_minute, fallback_account_id
    ) VALUES ('acc_fallback', 'tenant_failover', 'Fallback Resend', 'resend', '{}', 'f@test.com', 1000, 0, 60, NULL)
  `).run();

  db.prepare(`
    INSERT INTO email_accounts (
      id, tenant_id, name, provider_type, credentials, from_email,
      daily_quota_limit, daily_quota_used, rate_limit_per_minute, fallback_account_id
    ) VALUES ('acc_primary', 'tenant_failover', 'Primary SES', 'aws-ses', '{}', 'p@test.com', 1000, 0, 60, 'acc_fallback')
  `).run();


  it('should identify failover conditions properly', () => {
    expect(failover.shouldFailover(429, undefined)).toBe(true);
    expect(failover.shouldFailover(503, undefined)).toBe(true);
    expect(failover.shouldFailover(500, undefined)).toBe(true);
    expect(failover.shouldFailover(200, undefined)).toBe(false);
    expect(failover.shouldFailover(400, 'Invalid recipient email')).toBe(false);
    expect(failover.shouldFailover(undefined, 'Rate limit exceeded for account')).toBe(true);
    expect(failover.shouldFailover(undefined, 'ECONNREFUSED connect')).toBe(true);
  });

  it('should resolve the configured fallback account', () => {
    const fallback = failover.getFallbackAccount('acc_primary');
    expect(fallback).not.toBeNull();
    expect(fallback.id).toBe('acc_fallback');
    expect(fallback.provider_type).toBe('resend');
  });

  it('should not return already tried accounts in failover chain', () => {
    const fallback = failover.getFallbackAccount('acc_primary', ['acc_fallback']);
    expect(fallback).toBeNull();
  });
});
