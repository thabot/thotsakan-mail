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
    secretExpiresAt?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO email_accounts (
        id, tenant_id, name, provider_type, credentials, from_email, from_name,
        daily_quota_limit, rate_limit_per_minute, fallback_account_id, secret_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      account.fallbackAccountId || null,
      account.secretExpiresAt || null
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

  public update(id: string, tenantId: string, updates: Partial<{
    name: string;
    fromEmail: string;
    fromName: string;
    dailyQuotaLimit: number;
    rateLimitPerMinute: number;
    fallbackAccountId: string | null;
    isActive: boolean;
    credentials?: string;
    secretExpiresAt?: string | null;
  }>): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.fromEmail !== undefined) { fields.push('from_email = ?'); params.push(updates.fromEmail); }
    if (updates.fromName !== undefined) { fields.push('from_name = ?'); params.push(updates.fromName); }
    if (updates.dailyQuotaLimit !== undefined) { fields.push('daily_quota_limit = ?'); params.push(updates.dailyQuotaLimit); }
    if (updates.rateLimitPerMinute !== undefined) { fields.push('rate_limit_per_minute = ?'); params.push(updates.rateLimitPerMinute); }
    if (updates.fallbackAccountId !== undefined) { fields.push('fallback_account_id = ?'); params.push(updates.fallbackAccountId); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); params.push(updates.isActive ? 1 : 0); }
    if (updates.credentials !== undefined) { fields.push('credentials = ?'); params.push(updates.credentials); }
    if (updates.secretExpiresAt !== undefined) { fields.push('secret_expires_at = ?'); params.push(updates.secretExpiresAt); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    params.push(id, tenantId);

    const stmt = this.db.prepare(`
      UPDATE email_accounts SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?
    `);
    stmt.run(...params);
  }

  public delete(id: string, tenantId: string): void {
    const stmt = this.db.prepare('DELETE FROM email_accounts WHERE id = ? AND tenant_id = ?');
    stmt.run(id, tenantId);
  }
}
