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
  allowed_machine_id?: string;
  allowed_machine_ids?: string[];
  instance_limit?: number;
  environment?: 'production' | 'staging' | 'development' | 'any';
  issued_at: number;
  expires_at?: number;
  grace_period_days?: number;
}

export interface MachineFingerprint {
  machineId: string;
  platform: string;
  hostname: string;
  cpuModel: string;
  cpuCores: number;
  isContainer: boolean;
}

export type LicenseStatus = 'VALID' | 'GRACE_PERIOD' | 'BREAK_GLASS' | 'MACHINE_MISMATCH' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'REVOKED' | 'INVALID';

export interface LicenseVerificationResult {
  tier: LicenseTier;
  status: LicenseStatus;
  claims: LicenseClaims | null;
  isMachineBound: boolean;
  machineMatch: boolean;
  currentMachineId: string;
  isBreakGlassActive?: boolean;
  breakGlassHoursRemaining?: number;
  clockTampered?: boolean;
}

