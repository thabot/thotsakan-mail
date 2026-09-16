import { describe, expect, it } from 'bun:test';
import { LicenseManagerService } from '../../src/services/license-manager.service.js';
import { FeatureGateService } from '../../src/services/feature-gate.service.js';
import { generateTestKeys, createSignedTestLicense } from '../helpers/license-test-keys.js';

describe('FeatureGateService (Tier Gating Logic)', async () => {
  const { publicSpki, privateKey } = await generateTestKeys();

  it('should enforce COMMUNITY constraints when tier is COMMUNITY', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    await licenseManager.verifyLicense(); // Community
    const featureGate = new FeatureGateService(licenseManager);

    expect(featureGate.canAccessWebUI()).toBe(false);
    expect(featureGate.canUseDistributedDriver()).toBe(false);
    expect(featureGate.checkTenantLimit(2)).toBe(true);
    expect(featureGate.checkTenantLimit(3)).toBe(false); // max 3
  });

  it('should unlock WebUI and higher tenant limits for PRO tier', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const proKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_pro',
      tier: 'PRO',
      tenants_limit: 20,
    });
    await licenseManager.verifyLicense(proKey);
    const featureGate = new FeatureGateService(licenseManager);

    expect(featureGate.canAccessWebUI()).toBe(true);
    expect(featureGate.canUseDistributedDriver()).toBe(false);
    expect(featureGate.checkTenantLimit(15)).toBe(true);
    expect(featureGate.checkTenantLimit(20)).toBe(false); // max 20
  });

  it('should unlock Distributed Driver and unlimited limits for ENTERPRISE tier', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const entKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_ent',
      tier: 'ENTERPRISE',
      tenants_limit: 1000,
    });
    await licenseManager.verifyLicense(entKey);
    const featureGate = new FeatureGateService(licenseManager);

    expect(featureGate.canAccessWebUI()).toBe(true);
    expect(featureGate.canUseDistributedDriver()).toBe(true);
    expect(featureGate.checkTenantLimit(500)).toBe(true);
  });
});
