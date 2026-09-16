import { describe, expect, it } from 'bun:test';
import { LicenseManagerService } from '../../src/services/license-manager.service.js';
import { generateTestKeys, createSignedTestLicense } from '../helpers/license-test-keys.js';

describe('LicenseManagerService (Ed25519 Cryptographic Verification)', async () => {
  const { publicSpki, privateKey } = await generateTestKeys();
  const licenseManager = new LicenseManagerService(publicSpki);

  it('should fallback to COMMUNITY tier if no license key provided', async () => {
    const result = await licenseManager.verifyLicense();
    expect(result.tier).toBe('COMMUNITY');
    expect(result.claims).toBeNull();
  });

  it('should verify a valid PRO license key successfully', async () => {
    const validKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_pro_01',
      tier: 'PRO',
      tenants_limit: 20,
      accounts_limit: 50,
      features: ['web_ui', 'template_editor'],
    });

    const result = await licenseManager.verifyLicense(validKey);
    expect(result.tier).toBe('PRO');
    expect(result.claims?.sub).toBe('cust_pro_01');
    expect(result.claims?.tenants_limit).toBe(20);
  });

  it('should verify a valid ENTERPRISE license key successfully', async () => {
    const validKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_ent_01',
      tier: 'ENTERPRISE',
      tenants_limit: 9999,
      accounts_limit: 9999,
    });

    const result = await licenseManager.verifyLicense(validKey);
    expect(result.tier).toBe('ENTERPRISE');
  });

  it('should gracefully fallback to COMMUNITY if key is expired', async () => {
    const expiredKey = await createSignedTestLicense(
      privateKey,
      { sub: 'cust_expired', tier: 'PRO' },
      '-1d' // expired yesterday
    );

    const result = await licenseManager.verifyLicense(expiredKey);
    expect(result.tier).toBe('COMMUNITY');
    expect(result.claims).toBeNull();
  });

  it('should gracefully fallback to COMMUNITY if key is forged with different key', async () => {
    const forgedKeys = await generateTestKeys();
    const forgedKey = await createSignedTestLicense(forgedKeys.privateKey, {
      sub: 'attacker',
      tier: 'ENTERPRISE',
    });

    const result = await licenseManager.verifyLicense(forgedKey);
    expect(result.tier).toBe('COMMUNITY');
    expect(result.claims).toBeNull();
  });
});
