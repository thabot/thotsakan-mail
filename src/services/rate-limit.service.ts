import type { Database } from 'bun:sqlite';

export interface RateLimitStatus {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export class RateLimitService {
  // In-memory sliding minute tracking: accountId -> array of timestamp (ms)
  private minuteBuckets: Map<string, number[]> = new Map();

  constructor(private db: Database) {}

  public checkRateLimit(accountId: string): RateLimitStatus {
    const account: any = this.db.prepare(
      'SELECT id, daily_quota_limit, daily_quota_used, rate_limit_per_minute, provider_type FROM email_accounts WHERE id = ?'
    ).get(accountId);

    if (!account) {
      return { allowed: false, reason: `Account ${accountId} not found` };
    }

    // 1. Check daily quota
    if (account.daily_quota_used >= account.daily_quota_limit) {
      return {
        allowed: false,
        reason: `Daily quota limit reached (${account.daily_quota_used}/${account.daily_quota_limit})`,
        retryAfterSeconds: 3600, // wait an hour or next reset
      };
    }

    // 2. Check per-minute rate limit for this account
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    let timestamps = this.minuteBuckets.get(accountId) || [];
    timestamps = timestamps.filter((t) => t > oneMinuteAgo);

    if (timestamps.length >= account.rate_limit_per_minute) {
      const oldest = timestamps[0];
      const waitTimeMs = 60_000 - (now - oldest);
      return {
        allowed: false,
        reason: `Per-minute rate limit exceeded (${timestamps.length}/${account.rate_limit_per_minute})`,
        retryAfterSeconds: Math.max(1, Math.ceil(waitTimeMs / 1000)),
      };
    }

    // 3. Check provider-wide limits if configured
    const providerLimit: any = this.db.prepare(
      'SELECT rate_limit_per_minute, daily_quota_limit FROM provider_limits WHERE provider_type = ?'
    ).get(account.provider_type);

    if (providerLimit) {
      let providerTimestamps = this.minuteBuckets.get(`provider_${account.provider_type}`) || [];
      providerTimestamps = providerTimestamps.filter((t) => t > oneMinuteAgo);
      if (providerTimestamps.length >= providerLimit.rate_limit_per_minute) {
        return {
          allowed: false,
          reason: `Provider ${account.provider_type} rate limit exceeded`,
          retryAfterSeconds: 15,
        };
      }
    }

    return { allowed: true };
  }

  public recordUsage(accountId: string): void {
    const now = Date.now();
    let timestamps = this.minuteBuckets.get(accountId) || [];
    timestamps.push(now);
    this.minuteBuckets.set(accountId, timestamps);

    // Increment daily usage in DB
    this.db.prepare('UPDATE email_accounts SET daily_quota_used = daily_quota_used + 1 WHERE id = ?').run(accountId);

    // Update provider usage if applicable
    const account: any = this.db.prepare('SELECT provider_type FROM email_accounts WHERE id = ?').get(accountId);
    if (account?.provider_type) {
      const pKey = `provider_${account.provider_type}`;
      let pTimestamps = this.minuteBuckets.get(pKey) || [];
      pTimestamps.push(now);
      this.minuteBuckets.set(pKey, pTimestamps);
    }
  }

  public resetMinuteBucket(accountId: string): void {
    this.minuteBuckets.delete(accountId);
  }
}
