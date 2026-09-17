import type { Database } from 'bun:sqlite';

export class ApiKeyRepository {
  constructor(private db: Database) {}

  public create(id: string, tenantId: string, keyHash: string, name: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO tenant_api_keys (id, tenant_id, key_hash, name)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, tenantId, keyHash, name);
  }

  public findByHash(keyHash: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM tenant_api_keys WHERE key_hash = ? AND is_active = 1');
    return stmt.get(keyHash);
  }

  public countTenants(): number {
    const stmt = this.db.prepare('SELECT COUNT(DISTINCT tenant_id) as count FROM tenant_api_keys');
    const res: any = stmt.get();
    return res ? res.count : 0;
  }

  public countTotalKeys(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM tenant_api_keys');
    const res: any = stmt.get();
    return res ? res.count : 0;
  }
}
