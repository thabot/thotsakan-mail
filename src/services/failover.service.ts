import type { Database } from 'bun:sqlite';
import { AccountRepository } from '../database/repositories/account.repository.js';
import type { EmailAccount } from '../core/types/account.types.js';

export class FailoverService {
  private accountRepo: AccountRepository;

  constructor(private db: Database) {
    this.accountRepo = new AccountRepository(db);
  }

  /**
   * Determine whether an error is transient/rate-limit/server-error that warrants failover
   */
  public shouldFailover(statusCode?: number, errorDetails?: string): boolean {
    if (!statusCode && !errorDetails) return false;

    // 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500 && statusCode < 600)) {
      return true;
    }

    if (errorDetails) {
      const err = errorDetails.toLowerCase();
      if (
        err.includes('rate limit') ||
        err.includes('too many requests') ||
        err.includes('throttle') ||
        err.includes('quota exceeded') ||
        err.includes('econnrefused') ||
        err.includes('etimedout') ||
        err.includes('503') ||
        err.includes('502') ||
        err.includes('500')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find fallback account for a failed account
   */
  public getFallbackAccount(accountId: string, triedAccountIds: string[] = []): any | null {
    const currentAccount = this.accountRepo.findById(accountId);
    if (!currentAccount) return null;

    // 1. Check explicit fallback_account_id
    if (currentAccount.fallback_account_id) {
      if (!triedAccountIds.includes(currentAccount.fallback_account_id)) {
        const fallback = this.accountRepo.findById(currentAccount.fallback_account_id);
        if (fallback && fallback.is_active) {
          return fallback;
        }
      }
    }

    // 2. Check other active accounts in same tenant not yet tried
    const allTenantAccounts = this.accountRepo.findByTenantId(currentAccount.tenant_id);
    for (const acc of allTenantAccounts) {
      if (acc.id !== accountId && !triedAccountIds.includes(acc.id) && acc.is_active) {
        // Prefer an account with remaining quota
        if (acc.daily_quota_used < acc.daily_quota_limit) {
          return acc;
        }
      }
    }

    return null;
  }
}
