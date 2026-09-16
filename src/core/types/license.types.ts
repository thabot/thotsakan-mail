export type LicenseTier = 'COMMUNITY' | 'PRO' | 'ENTERPRISE';

export interface FeatureFlags {
  canAccessWebUI: boolean;
  canUseDistributedDriver: boolean;
  canUseVisualTemplateEditor: boolean;
  canUseBatchApi: boolean;
  canUseDeadLetterWebhook: boolean;
  maxTenants: number;
  maxAccounts: number;
}

export interface LicenseClaims {
  sub: string;
  tier: LicenseTier;
  tenants_limit?: number;
  accounts_limit?: number;
  features?: string[];
  issued_at: number;
  expires_at?: number;
}
