import type { LicenseTier, FeatureFlags } from '../core/types/license.types.js';
import type { LicenseManagerService } from './license-manager.service.js';

export class FeatureGateService {
  constructor(private licenseManager: LicenseManagerService) {}

  public getFlags(): FeatureFlags {
    const tier = this.licenseManager.getTier();
    const claims = this.licenseManager.getClaims();

    switch (tier) {
      case 'ENTERPRISE':
        return {
          canAccessWebUI: true,
          canUseDistributedDriver: true,
          canUseVisualTemplateEditor: true,
          canUseBatchApi: true,
          canUseDeadLetterWebhook: true,
          maxTenants: claims?.tenants_limit ?? 999999,
          maxAccounts: claims?.accounts_limit ?? 999999,
        };
      case 'PRO':
        return {
          canAccessWebUI: true,
          canUseDistributedDriver: false,
          canUseVisualTemplateEditor: true,
          canUseBatchApi: true,
          canUseDeadLetterWebhook: true,
          maxTenants: claims?.tenants_limit ?? 20,
          maxAccounts: claims?.accounts_limit ?? 50,
        };
      case 'COMMUNITY':
      default:
        return {
          canAccessWebUI: false,
          canUseDistributedDriver: false,
          canUseVisualTemplateEditor: false,
          canUseBatchApi: false,
          canUseDeadLetterWebhook: false,
          maxTenants: 3,
          maxAccounts: 5,
        };
    }
  }

  public canAccessWebUI(): boolean {
    return this.getFlags().canAccessWebUI;
  }

  public canUseDistributedDriver(): boolean {
    return this.getFlags().canUseDistributedDriver;
  }

  public checkTenantLimit(currentCount: number): boolean {
    return currentCount < this.getFlags().maxTenants;
  }
}
