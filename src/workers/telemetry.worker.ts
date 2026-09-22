import type { Database } from 'bun:sqlite';
import os from 'node:os';
import type { LicenseManagerService } from '../services/license-manager.service.js';

export interface TelemetryWorkerOptions {
  portalUrl?: string;
  intervalMs?: number;
  enabled?: boolean;
  licenseKey?: string;
  fetchFn?: (input: any, init?: any) => Promise<Response>;
}

export interface TelemetryPayload {
  license_key: string;
  machine_id: string;
  hostname: string;
  platform: string;
  engine_version: string;
  is_break_glass: boolean;
  total_sent_24h: number;
  failed_24h: number;
  active_accounts: number;
}

export class TelemetryWorker {
  private isRunning: boolean = false;
  private timer: any = null;
  private portalUrl: string;
  private intervalMs: number;
  private enabled: boolean;
  private licenseKey?: string;
  private fetchFn: (input: any, init?: any) => Promise<Response>;

  constructor(
    private db: Database,
    private licenseManager: LicenseManagerService,
    options: TelemetryWorkerOptions = {}
  ) {
    this.portalUrl = options.portalUrl || 'https://thotsakan-ops.thabot47.workers.dev';
    this.intervalMs = options.intervalMs || 300_000; // 5 minutes
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.licenseKey = options.licenseKey;
    this.fetchFn = options.fetchFn || fetch;
  }

  public start(): void {
    if (this.isRunning || !this.enabled) return;
    this.isRunning = true;

    // Send first ping shortly after boot (5 seconds)
    setTimeout(() => {
      if (this.isRunning) {
        this.sendPing().catch((err) => {
          console.warn('[TelemetryWorker] Initial ping error:', err?.message || err);
        });
      }
    }, 5000);

    this.timer = setInterval(() => {
      this.sendPing().catch((err) => {
        console.warn('[TelemetryWorker] Periodic ping error:', err?.message || err);
      });
    }, this.intervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async collectPayload(): Promise<TelemetryPayload> {
    const machineStatus = await this.licenseManager.getMachineStatus();
    const effectiveKey = this.licenseKey || process.env.LICENSE_KEY || '';

    // Collect sent/failed in last 24 hours
    let total_sent_24h = 0;
    let failed_24h = 0;
    let active_accounts = 0;

    try {
      const sentRow = this.db.prepare(`
        SELECT COUNT(*) as count FROM email_logs 
        WHERE status = 'SENT' AND datetime(created_at) >= datetime('now', '-1 day')
      `).get() as { count: number } | undefined;
      total_sent_24h = sentRow?.count || 0;

      const failedRow = this.db.prepare(`
        SELECT COUNT(*) as count FROM email_logs 
        WHERE status = 'FAILED' AND datetime(created_at) >= datetime('now', '-1 day')
      `).get() as { count: number } | undefined;
      failed_24h = failedRow?.count || 0;

      // Active accounts check if table exists
      const accountsTable = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='smtp_accounts'
      `).get();
      if (accountsTable) {
        const accRow = this.db.prepare(`
          SELECT COUNT(*) as count FROM smtp_accounts WHERE is_active = 1
        `).get() as { count: number } | undefined;
        active_accounts = accRow?.count || 0;
      }
    } catch {
      // Table might not be migrated or query failed; fallback gracefully
    }

    return {
      license_key: effectiveKey,
      machine_id: machineStatus.currentMachineId,
      hostname: os.hostname(),
      platform: `${os.platform()} (${os.arch()})`,
      engine_version: '1.0.0',
      is_break_glass: Boolean(machineStatus.isBreakGlassActive),
      total_sent_24h,
      failed_24h,
      active_accounts,
    };
  }

  public async sendPing(): Promise<{ success: boolean; remoteLocked?: boolean; status?: string }> {
    const payload = await this.collectPayload();

    // If no license key configured, telemetry ping is skipped (or sends community check)
    if (!payload.license_key) {
      return { success: false, status: 'SKIPPED_NO_LICENSE' };
    }

    try {
      const endpoint = `${this.portalUrl.replace(/\/$/, '')}/api/v1/telemetry/ping`;
      const response = await this.fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ThotsakanMailEngine-Telemetry/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10-second timeout
      });

      if (!response.ok) {
        // HTTP error (e.g. 400 or 500)
        const errorText = await response.text();
        console.warn(`[TelemetryWorker] Ping returned status ${response.status}: ${errorText}`);
        return { success: false, status: `HTTP_${response.status}` };
      }

      const result = await response.json() as {
        status?: string;
        lock_enforced?: boolean;
        reason?: string;
        action?: string;
      };

      // Realtime Remote Kill-Switch Enforcement
      if (result.lock_enforced || result.status === 'REVOKED' || result.status === 'LOCKED') {
        this.licenseManager.applyRemoteLock(result.reason || 'Revoked remotely by license portal');
        return { success: true, remoteLocked: true, status: result.status };
      } else if (this.licenseManager.isRemoteLocked() && (result.status === 'ACTIVE' || result.status === 'VALID')) {
        // Unlock if vendor unrevoked/reactivated
        this.licenseManager.clearRemoteLock();
      }

      return { success: true, remoteLocked: false, status: result.status };
    } catch (err: any) {
      // Fail-soft: Network timeout or DNS errors do NOT disrupt local engine operation
      console.warn('[TelemetryWorker] Fail-soft: Unable to reach telemetry endpoint:', err?.message || err);
      return { success: false, status: 'NETWORK_ERROR' };
    }
  }
}
