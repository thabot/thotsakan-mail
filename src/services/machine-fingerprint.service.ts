import os from 'os';
import fs from 'fs';
import type { MachineFingerprint } from '../core/types/license.types.js';

export class MachineFingerprintService {
  private cachedFingerprint: MachineFingerprint | null = null;

  public isContainer(): boolean {
    if (process.env.CONTAINER || process.env.KUBERNETES_SERVICE_HOST) {
      return true;
    }
    try {
      if (fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv')) {
        return true;
      }
      if (fs.existsSync('/proc/1/cgroup')) {
        const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
        if (cgroup.includes('docker') || cgroup.includes('kubepods') || cgroup.includes('containerd')) {
          return true;
        }
      }
    } catch {
      // Ignore filesystem access errors
    }
    return false;
  }

  public async getFingerprint(): Promise<MachineFingerprint> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    if (process.env.THOTSAKAN_MACHINE_ID && process.env.THOTSAKAN_MACHINE_ID.trim()) {
      const id = process.env.THOTSAKAN_MACHINE_ID.trim();
      this.cachedFingerprint = {
        machineId: id.startsWith('thk_mach_') ? id : `thk_mach_${id}`,
        platform: os.platform(),
        hostname: os.hostname(),
        cpuModel: os.cpus()[0]?.model || 'Generic CPU',
        cpuCores: os.cpus().length || 1,
        isContainer: this.isContainer(),
      };
      return this.cachedFingerprint;
    }

    const platform = os.platform();
    const hostname = os.hostname();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Generic CPU';
    const cpuCores = cpus.length || 1;
    const isContainerEnv = this.isContainer();

    let hardwareSeed = '';

    if (platform === 'linux') {
      try {
        if (fs.existsSync('/etc/machine-id')) {
          hardwareSeed = fs.readFileSync('/etc/machine-id', 'utf8').trim();
        } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
          hardwareSeed = fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
        }
      } catch {
        // fallback
      }
    }

    if (!hardwareSeed) {
      const netInterfaces = os.networkInterfaces();
      const macs: string[] = [];
      for (const netList of Object.values(netInterfaces)) {
        if (!netList) continue;
        for (const iface of netList) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macs.push(iface.mac.toLowerCase());
          }
        }
      }
      macs.sort();
      hardwareSeed = `${platform}:${hostname}:${cpuModel}:${cpuCores}:${macs.join(',')}`;
    }

    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(hardwareSeed);
    const hexDigest = hasher.digest('hex');
    const machineId = `thk_mach_${hexDigest.substring(0, 16)}`;

    this.cachedFingerprint = {
      machineId,
      platform,
      hostname,
      cpuModel,
      cpuCores,
      isContainer: isContainerEnv,
    };

    return this.cachedFingerprint;
  }

  public async validateMachine(allowed?: string | string[]): Promise<boolean> {
    if (!allowed) {
      return true;
    }

    const { machineId } = await this.getFingerprint();

    if (typeof allowed === 'string') {
      return allowed.trim().toLowerCase() === machineId.toLowerCase();
    }

    if (Array.isArray(allowed)) {
      if (allowed.length === 0) return true;
      return allowed.some((id) => id.trim().toLowerCase() === machineId.toLowerCase());
    }

    return false;
  }

  public clearCache(): void {
    this.cachedFingerprint = null;
  }
}
