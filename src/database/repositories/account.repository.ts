import type { Database } from 'bun:sqlite';
import type { EmailAccount, ProviderCredentials, ProviderType } from '../../core/types/index.js';

export class AccountRepository {
  constructor(private db: Database) {}

  public create(account: {
    id: string;
    tenantId: string;
    name: string;
    providerType: ProviderType;
    encryptedCredentials: string;
    fromEmail: string;
    fromName?: string;
    dailyQuotaLimit?: number;
    rateLimitPerMinute?: number;
    fallbackAccountId?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO email_accounts (
        id, tenant_id, name, provider_type, credentials, from_email, from_name,
        daily_quota_limit, rate_limit_per_minute, fallback_account_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      account.id,
      account.tenantId,
      account.name,
      account.providerType,
      account.encryptedCredentials,
      account.fromEmail,
      account.fromName || null,
      account.dailyQuotaLimit || 10000,
      account.rateLimitPerMinute || 60,
      account.fallbackAccountId || null
    );
  }

  public findById(id: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM email_accounts WHERE id = ?');
    return stmt.get(id);
  }

  public findByTenantId(tenantId: string): any[] {
    const stmt = this.db.prepare('SELECT * FROM email_accounts WHERE tenant_id = ? AND is_active = 1');
    return stmt.all(tenantId);
  }

  public incrementDailyUsage(id: string): void {
    const stmt = this.db.prepare('UPDATE email_accounts SET daily_quota_used = daily_quota_used + 1 WHERE id = ?');
    stmt.run(id);
  }

  public resetDailyUsage(id: string): void {
    const stmt = this.db.prepare('UPDATE email_accounts SET daily_quota_used = 0 WHERE id = ?');
    stmt.run(id);
  }

  public updateTokenCache(id: string, encryptedToken: string, expiresAt: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_accounts 
      SET token_cache = ?, token_expires_at = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);
    stmt.run(encryptedToken, expiresAt, id);
  }
}
