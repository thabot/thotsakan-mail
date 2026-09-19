import { describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { LicenseManagerService } from '../../src/services/license-manager.service.js';
import { MachineFingerprintService } from '../../src/services/machine-fingerprint.service.js';
import { generateTestKeys, createSignedTestLicense } from '../helpers/license-test-keys.js';
import { runMigrations } from '../../src/database/db.js';

describe('LicenseManagerService (Ed25519 & Hybrid Hardware Binding)', async () => {
  const { publicSpki, privateKey } = await generateTestKeys();
  const fingerprintService = new MachineFingerprintService();
  const currentFp = await fingerprintService.getFingerprint();

  it('should fallback to COMMUNITY tier if no license key provided', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const result = await licenseManager.verifyLicense();
    expect(result.tier).toBe('COMMUNITY');
    expect(result.status).toBe('VALID');
    expect(result.claims).toBeNull();
    expect(result.isMachineBound).toBe(false);
  });

  it('should verify an unrestricted PRO license key successfully', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const validKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_pro_01',
      tier: 'PRO',
      tenants_limit: 20,
      accounts_limit: 50,
      features: ['web_ui', 'template_editor'],
    });

    const result = await licenseManager.verifyLicense(validKey);
    expect(result.tier).toBe('PRO');
    expect(result.status).toBe('VALID');
    expect(result.claims?.sub).toBe('cust_pro_01');
    expect(result.claims?.tenants_limit).toBe(20);
    expect(result.isMachineBound).toBe(false);
  });

  it('should verify when allowed_machine_id matches current machine', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const machineBoundKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_ent_bound',
      tier: 'ENTERPRISE',
      allowed_machine_id: currentFp.machineId,
      instance_limit: 1,
    });

    const result = await licenseManager.verifyLicense(machineBoundKey);
    expect(result.tier).toBe('ENTERPRISE');
    expect(result.status).toBe('VALID');
    expect(result.isMachineBound).toBe(true);
    expect(result.machineMatch).toBe(true);
    expect(result.currentMachineId).toBe(currentFp.machineId);
  });

  it('should reject and gracefully fallback to COMMUNITY when allowed_machine_id does not match', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const mismatchKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_ent_mismatch',
      tier: 'ENTERPRISE',
      allowed_machine_id: 'thk_mach_different_unauthorized_server',
      instance_limit: 1,
    });

    const result = await licenseManager.verifyLicense(mismatchKey);
    expect(result.tier).toBe('COMMUNITY');
    expect(result.status).toBe('MACHINE_MISMATCH');
    expect(result.isMachineBound).toBe(true);
    expect(result.machineMatch).toBe(false);
    expect(result.claims).toBeNull();
  });

  it('should accept when current machine is within allowed_machine_ids array', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const clusterKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_cluster_nodes',
      tier: 'ENTERPRISE',
      allowed_machine_ids: ['thk_mach_server_alpha', currentFp.machineId, 'thk_mach_server_omega'],
      instance_limit: 3,
    });

    const result = await licenseManager.verifyLicense(clusterKey);
    expect(result.tier).toBe('ENTERPRISE');
    expect(result.status).toBe('VALID');
    expect(result.isMachineBound).toBe(true);
    expect(result.machineMatch).toBe(true);
  });

  it('should gracefully fallback to COMMUNITY if key is expired', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const expiredKey = await createSignedTestLicense(
      privateKey,
      { sub: 'cust_expired', tier: 'PRO' },
      '-1d' // expired yesterday
    );

    const result = await licenseManager.verifyLicense(expiredKey);
    expect(result.tier).toBe('COMMUNITY');
    expect(result.status).toBe('EXPIRED');
    expect(result.claims).toBeNull();
  });

  it('should activate 72h Break-Glass mode in emergency disaster recovery', async () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const licenseManager = new LicenseManagerService({
      publicKeySpki: publicSpki,
      db,
      isEmergencyOverride: true,
      emergencyReason: 'Datacenter flood failover',
    });

    const result = await licenseManager.verifyLicense();
    expect(result.tier).toBe('ENTERPRISE');
    expect(result.status).toBe('BREAK_GLASS');
    expect(result.isBreakGlassActive).toBe(true);
    expect(result.breakGlassHoursRemaining).toBe(72);
  });

  it('should detect clock tampering and enforce safe mode', async () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const licenseManager = new LicenseManagerService({
      publicKeySpki: publicSpki,
      db,
    });

    // Record future time
    db.prepare('INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))')
      .run('last_known_timestamp', String(Date.now() + 10 * 3600 * 1000)); // 10 hours in future

    const validKey = await createSignedTestLicense(privateKey, {
      sub: 'cust_pro',
      tier: 'PRO',
    });

    const result = await licenseManager.verifyLicense(validKey);
    expect(result.tier).toBe('COMMUNITY');
    expect(result.status).toBe('CLOCK_TAMPERED');
    expect(result.clockTampered).toBe(true);
  });
});
