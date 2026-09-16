import type { EmailMessage } from '../types/email.types.js';

export interface IRoutingRule {
  id: string;
  tenantId: string;
  priority: number;
  conditionType: 'domain_match' | 'subject_contains' | 'recipient_regex';
  conditionValue: string;
  targetAccountId: string;
  isActive: boolean;
  matches(message: EmailMessage): boolean;
}
