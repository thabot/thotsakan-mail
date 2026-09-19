import { describe, expect, it, beforeEach } from 'bun:test';
import { MachineFingerprintService } from '../../src/services/machine-fingerprint.service.js';

describe('MachineFingerprintService (Deterministic Hardware Binding)', () => {
  let service: MachineFingerprintService;

  beforeEach(() => {
    delete process.env.THOTSAKAN_MACHINE_ID;
    service = new MachineFingerprintService();
  });

  it('should generate a valid deterministic machine fingerprint starting with thk_mach_', async () => {
    const fp1 = await service.getFingerprint();
    const fp2 = await service.getFingerprint();

    expect(fp1.machineId.startsWith('thk_mach_')).toBe(true);
    expect(fp1.machineId.length).toBeGreaterThan(10);
    expect(fp1.machineId).toBe(fp2.machineId); // Must be cached/consistent
    expect(fp1.platform).toBeDefined();
    expect(fp1.hostname).toBeDefined();
    expect(fp1.cpuCores).toBeGreaterThan(0);
  });

  it('should honor THOTSAKAN_MACHINE_ID environment override', async () => {
    process.env.THOTSAKAN_MACHINE_ID = 'cluster_node_01';
    service.clearCache();

    const fp = await service.getFingerprint();
    expect(fp.machineId).toBe('thk_mach_cluster_node_01');

    delete process.env.THOTSAKAN_MACHINE_ID;
  });

  it('should validate single allowed machine ID correctly', async () => {
    const fp = await service.getFingerprint();

    const isMatch = await service.validateMachine(fp.machineId);
    expect(isMatch).toBe(true);

    const isMismatch = await service.validateMachine('thk_mach_different_unauthorized_node');
    expect(isMismatch).toBe(false);
  });

  it('should validate multiple allowed machine IDs in cluster array correctly', async () => {
    const fp = await service.getFingerprint();

    const isMatch = await service.validateMachine([
      'thk_mach_other_node_1',
      fp.machineId,
      'thk_mach_other_node_2',
    ]);
    expect(isMatch).toBe(true);

    const isMismatch = await service.validateMachine([
      'thk_mach_other_node_1',
      'thk_mach_other_node_2',
    ]);
    expect(isMismatch).toBe(false);
  });

  it('should return true if no allowed machine is specified (unrestricted license)', async () => {
    const isAllowed = await service.validateMachine(undefined);
    expect(isAllowed).toBe(true);
  });
});
