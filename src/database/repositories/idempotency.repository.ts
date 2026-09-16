import type { Database } from 'bun:sqlite';

export class IdempotencyRepository {
  constructor(private db: Database) {}

  public get(key: string, tenantId: string): { status: number; body: string } | null {
    const stmt = this.db.prepare(`
      SELECT response_status as status, response_body as body
      FROM idempotency_keys
      WHERE key = ? AND tenant_id = ? AND expires_at > datetime('now')
    `);
    const res: any = stmt.get(key, tenantId);
    return res || null;
  }

  public save(key: string, tenantId: string, status: number, body: string, ttlHours: number = 24): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO idempotency_keys (key, tenant_id, response_status, response_body, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', ? || ' hours'))
    `);
    stmt.run(key, tenantId, status, body, ttlHours.toString());
  }
}
