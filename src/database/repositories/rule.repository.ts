import type { Database } from 'bun:sqlite';

export interface RoutingRuleRecord {
  id: string;
  tenant_id: string;
  priority: number;
  condition_type: 'domain_match' | 'subject_contains' | 'recipient_regex';
  condition_value: string;
  target_account_id: string;
  is_active: number;
  created_at: string;
}

export class RoutingRuleRepository {
  constructor(private db: Database) {}

  public create(rule: {
    id: string;
    tenantId: string;
    priority?: number;
    conditionType: 'domain_match' | 'subject_contains' | 'recipient_regex';
    conditionValue: string;
    targetAccountId: string;
    isActive?: boolean;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO routing_rules (id, tenant_id, priority, condition_type, condition_value, target_account_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      rule.id,
      rule.tenantId,
      rule.priority ?? 0,
      rule.conditionType,
      rule.conditionValue,
      rule.targetAccountId,
      rule.isActive === false ? 0 : 1
    );
  }

  public findById(id: string): RoutingRuleRecord | null {
    const stmt = this.db.prepare('SELECT * FROM routing_rules WHERE id = ?');
    return (stmt.get(id) as RoutingRuleRecord) || null;
  }

  public findActiveByTenantId(tenantId: string): RoutingRuleRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM routing_rules WHERE tenant_id = ? AND is_active = 1 ORDER BY priority DESC, created_at ASC'
    );
    return stmt.all(tenantId) as RoutingRuleRecord[];
  }

  public listByTenantId(tenantId: string): RoutingRuleRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM routing_rules WHERE tenant_id = ? ORDER BY priority DESC, created_at ASC'
    );
    return stmt.all(tenantId) as RoutingRuleRecord[];
  }

  public delete(id: string, tenantId: string): void {
    const stmt = this.db.prepare('DELETE FROM routing_rules WHERE id = ? AND tenant_id = ?');
    stmt.run(id, tenantId);
  }
}
