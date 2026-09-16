import type { Database } from 'bun:sqlite';

export class SuppressionRepository {
  constructor(private db: Database) {}

  public isSuppressed(email: string, tenantId: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM suppression_list WHERE email = ? AND tenant_id = ?');
    return !!stmt.get(email.toLowerCase().trim(), tenantId);
  }

  public add(email: string, tenantId: string, reason: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO suppression_list (email, tenant_id, reason)
      VALUES (?, ?, ?)
    `);
    stmt.run(email.toLowerCase().trim(), tenantId, reason);
  }

  public remove(email: string, tenantId: string): void {
    const stmt = this.db.prepare('DELETE FROM suppression_list WHERE email = ? AND tenant_id = ?');
    stmt.run(email.toLowerCase().trim(), tenantId);
  }

  public list(tenantId: string, limit: number = 100): any[] {
    const stmt = this.db.prepare('SELECT * FROM suppression_list WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(tenantId, limit);
  }
}
