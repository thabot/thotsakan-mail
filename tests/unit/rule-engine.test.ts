import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { RoutingRuleRepository } from '../../src/database/repositories/rule.repository.js';
import { RuleEngineService } from '../../src/services/rule-engine.service.js';

describe('Unit: Dynamic Routing Rule Engine', () => {
  const db = createTestDatabase();
  const ruleRepo = new RoutingRuleRepository(db);
  const engine = new RuleEngineService(db);

  // Insert mock accounts
  db.prepare(`
    INSERT INTO email_accounts (id, tenant_id, name, provider_type, credentials, from_email)
    VALUES 
      ('acc_m365', 'tenant_rule', 'M365 Account', 'ms-graph', '{}', 'admin@corp.com'),
      ('acc_ses', 'tenant_rule', 'SES Bulk', 'aws-ses', '{}', 'noreply@corp.com')
  `).run();

  // Create rule: Any email to @company.internal routes to acc_m365 (priority 10)
  ruleRepo.create({
    id: 'rule_internal',
    tenantId: 'tenant_rule',
    priority: 10,
    conditionType: 'domain_match',
    conditionValue: 'company.internal',
    targetAccountId: 'acc_m365',
  });

  // Create rule: Subject contains 'Urgent Security' routes to acc_ses (priority 20)
  ruleRepo.create({
    id: 'rule_urgent',
    tenantId: 'tenant_rule',
    priority: 20,
    conditionType: 'subject_contains',
    conditionValue: 'Urgent Security',
    targetAccountId: 'acc_ses',
  });

  it('should route based on domain match', () => {
    const matched = engine.matchAccount(
      { to: 'john@company.internal', subject: 'Regular Notice' } as any,
      'tenant_rule'
    );
    expect(matched).toBe('acc_m365');
  });

  it('should route based on highest priority rule when multiple conditions could apply', () => {
    // Both urgent rule (priority 20) and domain rule (priority 10) could match
    const matched = engine.matchAccount(
      { to: 'john@company.internal', subject: 'Urgent Security Alert!' } as any,
      'tenant_rule'
    );
    expect(matched).toBe('acc_ses'); // Priority 20 wins
  });

  it('should return null when no rules match', () => {
    const matched = engine.matchAccount(
      { to: 'someone@gmail.com', subject: 'Normal Email' } as any,
      'tenant_rule'
    );
    expect(matched).toBeNull();
  });
});
