import * as jose from 'jose';
import type { Database } from 'bun:sqlite';
import type { 
  LicenseClaims, 
  LicenseTier, 
  LicenseStatus, 
  LicenseVerificationResult 
} from '../core/types/license.types.js';
import { MachineFingerprintService } from './machine-fingerprint.service.js';
import { ClockTamperService, BreakGlassService } from './license-security.service.js';
import { ClusterCoordinatorService } from './cluster-coordinator.service.js';

// Default Master Public Key (Ed25519) for verification
export const DEFAULT_PUBLIC_KEY_SPKI = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEANkU1bVpCZXFwOGJ4Y1p5MmN6WDFkVGNpY09GZ1Z0TXh5dXZ3
-----END PUBLIC KEY-----`;

export interface LicenseManagerOptions {
  publicKeySpki?: string;
  fingerprintService?: MachineFingerprintService;
  db?: Database;
  isEmergencyOverride?: boolean;
  emergencyReason?: string;
}

export class LicenseManagerService {
  private currentTier: LicenseTier = 'COMMUNITY';
  private currentStatus: LicenseStatus = 'VALID';
  private claims: LicenseClaims | null = null;
  private publicKeySpki: string;
  private fingerprintService: MachineFingerprintService;
  private clockTamperService?: ClockTamperService;
  private breakGlassService?: BreakGlassService;
  private clusterCoordinator?: ClusterCoordinatorService;
  private isEmergencyOverride: boolean;
  private emergencyReason?: string;

  private isMachineBound: boolean = false;
  private machineMatch: boolean = true;
  private currentMachineId: string = '';
  private isBreakGlassActive: boolean = false;
  private breakGlassHoursRemaining: number = 0;
  private isClockTampered: boolean = false;

  constructor(options?: string | LicenseManagerOptions) {
    if (typeof options === 'string') {
      this.publicKeySpki = options;
      this.fingerprintService = new MachineFingerprintService();
      this.isEmergencyOverride = false;
    } else {
      this.publicKeySpki = options?.publicKeySpki || DEFAULT_PUBLIC_KEY_SPKI;
      this.fingerprintService = options?.fingerprintService || new MachineFingerprintService();
      this.isEmergencyOverride = Boolean(options?.isEmergencyOverride);
      this.emergencyReason = options?.emergencyReason;
      if (options?.db) {
        this.clockTamperService = new ClockTamperService(options.db);
        this.breakGlassService = new BreakGlassService(options.db);
        this.clusterCoordinator = new ClusterCoordinatorService(options.db);
      }
    }
  }

  public async verifyLicense(licenseKey?: string): Promise<LicenseVerificationResult> {
    const fingerprint = await this.fingerprintService.getFingerprint();
    this.currentMachineId = fingerprint.machineId;

    // 1. Clock Tampering / Time-Rollback Verification
    if (this.clockTamperService) {
      const clockCheck = this.clockTamperService.verifyAndRecordTime();
      if (!clockCheck.isValid) {
        this.isClockTampered = true;
        this.currentTier = 'COMMUNITY';
        this.currentStatus = 'CLOCK_TAMPERED';
        this.claims = null;
        return this.buildResult();
      }
    }
    this.isClockTampered = false;

    // 2. Emergency Break-Glass DR Mode Evaluation
    if (this.breakGlassService && this.isEmergencyOverride) {
      const breakGlassCheck = this.breakGlassService.evaluateBreakGlass(
        this.isEmergencyOverride,
        this.emergencyReason
      );

      if (breakGlassCheck.isActive) {
        this.isBreakGlassActive = true;
        this.breakGlassHoursRemaining = breakGlassCheck.hoursRemaining;
        this.currentTier = 'ENTERPRISE';
        this.currentStatus = 'BREAK_GLASS';
        this.claims = {
          sub: 'disaster-recovery-break-glass',
          tier: 'ENTERPRISE',
          instance_limit: 99,
          tenants_limit: 9999,
          accounts_limit: 9999,
          features: ['web_ui', 'distributed_driver', 'visual_template_editor', 'batch_api', 'dead_letter_webhook'],
          issued_at: Math.floor(Date.now() / 1000),
          environment: 'production',
        };
        return this.buildResult();
      } else if (breakGlassCheck.isExpired) {
        this.isBreakGlassActive = false;
        this.breakGlassHoursRemaining = 0;
        this.currentTier = 'COMMUNITY';
        this.currentStatus = 'EXPIRED';
        this.claims = null;
        return this.buildResult();
      }
    }

    // 3. Normal License Key Verification
    if (!licenseKey || licenseKey.trim() === '') {
      this.currentTier = 'COMMUNITY';
      this.currentStatus = 'VALID';
      this.claims = null;
      this.isMachineBound = false;
      this.machineMatch = true;
      return this.buildResult();
    }

    try {
      const publicKey = await jose.importSPKI(this.publicKeySpki, 'EdDSA');
      const { payload } = await jose.jwtVerify(licenseKey, publicKey);

      const claims = payload as unknown as LicenseClaims;

      // Check Machine Binding
      const hasSingleMachine = Boolean(claims.allowed_machine_id);
      const hasMultiMachine = Boolean(claims.allowed_machine_ids && claims.allowed_machine_ids.length > 0);
      this.isMachineBound = hasSingleMachine || hasMultiMachine;

      if (this.isMachineBound) {
        const allowed = claims.allowed_machine_id || claims.allowed_machine_ids;
        this.machineMatch = await this.fingerprintService.validateMachine(allowed);

        if (!this.machineMatch) {
          console.warn(`⚠️ [LICENSE WARNING] Machine mismatch for [${this.currentMachineId}]. Reverting to COMMUNITY tier.`);
          this.currentTier = 'COMMUNITY';
          this.currentStatus = 'MACHINE_MISMATCH';
          this.claims = null;
          return this.buildResult();
        }
      } else {
        this.machineMatch = true;
      }

      // 4. Cluster Coordinator Heartbeat & Capacity
      if (this.clusterCoordinator) {
        this.clusterCoordinator.heartbeat(this.currentMachineId);
        const capacity = this.clusterCoordinator.evaluateClusterCapacity(
          this.currentMachineId,
          claims.instance_limit || 1
        );
        if (!capacity.isAuthorized) {
          console.warn(`⚠️ [LICENSE CLUSTER] Node quota exceeded (Active: ${capacity.activeCount}, Allowed: ${capacity.totalAllowed}). Standing by in COMMUNITY tier.`);
          this.currentTier = 'COMMUNITY';
          this.currentStatus = 'GRACE_PERIOD';
          this.claims = null;
          return this.buildResult();
        }
      }

      this.claims = claims;
      this.currentTier = claims.tier || 'COMMUNITY';
      this.currentStatus = 'VALID';

      return this.buildResult();
    } catch (err: any) {
      console.warn('⚠️ Invalid or expired license key. Falling back gracefully to COMMUNITY tier.');
      this.currentTier = 'COMMUNITY';
      this.currentStatus = err?.code === 'ERR_JWT_EXPIRED' ? 'EXPIRED' : 'INVALID';
      this.claims = null;
      this.isMachineBound = false;
      this.machineMatch = true;
      return this.buildResult();
    }
  }

  private buildResult(): LicenseVerificationResult {
    return {
      tier: this.currentTier,
      status: this.currentStatus,
      claims: this.claims,
      isMachineBound: this.isMachineBound,
      machineMatch: this.machineMatch,
      currentMachineId: this.currentMachineId,
      isBreakGlassActive: this.isBreakGlassActive,
      breakGlassHoursRemaining: this.breakGlassHoursRemaining,
      clockTampered: this.isClockTampered,
    };
  }

  public getTier(): LicenseTier {
    return this.currentTier;
  }

  public getStatus(): LicenseStatus {
    return this.currentStatus;
  }

  public getClaims(): LicenseClaims | null {
    return this.claims;
  }

  public async getMachineStatus(): Promise<{
    isMachineBound: boolean;
    machineMatch: boolean;
    currentMachineId: string;
    isBreakGlassActive: boolean;
    breakGlassHoursRemaining: number;
    clockTampered: boolean;
  }> {
    if (!this.currentMachineId) {
      const fp = await this.fingerprintService.getFingerprint();
      this.currentMachineId = fp.machineId;
    }
    return {
      isMachineBound: this.isMachineBound,
      machineMatch: this.machineMatch,
      currentMachineId: this.currentMachineId,
      isBreakGlassActive: this.isBreakGlassActive,
      breakGlassHoursRemaining: this.breakGlassHoursRemaining,
      clockTampered: this.isClockTampered,
    };
  }

}
