import type { Database } from 'bun:sqlite';
import { RoutingRuleRepository, type RoutingRuleRecord } from '../database/repositories/rule.repository.js';
import type { EmailMessage } from '../core/types/email.types.js';

export class RuleEngineService {
  private ruleRepo: RoutingRuleRepository;

  constructor(private db: Database) {
    this.ruleRepo = new RoutingRuleRepository(db);
  }

  /**
   * Evaluate rules in priority order and return matched account ID if any
   */
  public matchAccount(message: EmailMessage, tenantId: string): string | null {
    const rules = this.ruleRepo.findActiveByTenantId(tenantId);
    if (!rules || rules.length === 0) return null;

    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    const subject = message.subject || '';

    for (const rule of rules) {
      if (this.evaluateRule(rule, recipients, subject)) {
        return rule.target_account_id;
      }
    }

    return null;
  }

  private evaluateRule(rule: RoutingRuleRecord, recipients: string[], subject: string): boolean {
    switch (rule.condition_type) {
      case 'domain_match': {
        const domain = rule.condition_value.toLowerCase().trim().replace(/^@/, '');
        return recipients.some((r) => {
          const parts = r.split('@');
          return parts.length > 1 && parts[1].toLowerCase() === domain;
        });
      }

      case 'subject_contains': {
        return subject.toLowerCase().includes(rule.condition_value.toLowerCase());
      }

      case 'recipient_regex': {
        try {
          const regex = new RegExp(rule.condition_value, 'i');
          return recipients.some((r) => regex.test(r));
        } catch {
          return false;
        }
      }

      default:
        return false;
    }
  }
}
