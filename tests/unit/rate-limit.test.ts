import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { RateLimitService } from '../../src/services/rate-limit.service.js';

describe('Unit: RateLimitService', () => {
  const db = createTestDatabase();
  const rateLimiter = new RateLimitService(db);

  // Insert mock account with rate limit 2/min, daily quota 5
  db.prepare(`
    INSERT INTO email_accounts (
      id, tenant_id, name, provider_type, credentials, from_email,
      daily_quota_limit, daily_quota_used, rate_limit_per_minute
    ) VALUES ('acc_test_rate', 'tenant_test', 'Rate Test Account', 'aws-ses', '{}', 'test@example.com', 5, 0, 2)
  `).run();

  it('should allow requests within rate limit', () => {
    const check1 = rateLimiter.checkRateLimit('acc_test_rate');
    expect(check1.allowed).toBe(true);

    rateLimiter.recordUsage('acc_test_rate');
    const check2 = rateLimiter.checkRateLimit('acc_test_rate');
    expect(check2.allowed).toBe(true);

    rateLimiter.recordUsage('acc_test_rate');
  });

  it('should block requests exceeding per-minute rate limit', () => {
    // 2 usage already recorded, limit is 2/min
    const check = rateLimiter.checkRateLimit('acc_test_rate');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Per-minute rate limit exceeded');
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should block requests when daily quota is exhausted', () => {
    rateLimiter.resetMinuteBucket('acc_test_rate');
    // Set daily usage to max
    db.prepare('UPDATE email_accounts SET daily_quota_used = 5 WHERE id = ?').run('acc_test_rate');

    const check = rateLimiter.checkRateLimit('acc_test_rate');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Daily quota limit reached');
  });
});
