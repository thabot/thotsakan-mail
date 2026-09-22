import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { LicenseManagerService } from '../../../src/services/license-manager.service.js';
import { TelemetryWorker } from '../../../src/workers/telemetry.worker.js';

describe('TelemetryWorker', () => {
  let db: Database;
  let licenseManager: LicenseManagerService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.run(`
      CREATE TABLE email_logs (
        id TEXT PRIMARY KEY,
        status TEXT,
        created_at TEXT
      );
      CREATE TABLE smtp_accounts (
        id TEXT PRIMARY KEY,
        is_active INTEGER
      );
    `);
    licenseManager = new LicenseManagerService({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('should collect correct metrics from sqlite database', async () => {
    // Insert mock data
    db.run(`INSERT INTO email_logs VALUES ('1', 'SENT', datetime('now'))`);
    db.run(`INSERT INTO email_logs VALUES ('2', 'SENT', datetime('now'))`);
    db.run(`INSERT INTO email_logs VALUES ('3', 'FAILED', datetime('now'))`);
    db.run(`INSERT INTO smtp_accounts VALUES ('acc-1', 1)`);
    db.run(`INSERT INTO smtp_accounts VALUES ('acc-2', 0)`);

    const worker = new TelemetryWorker(db, licenseManager, {
      licenseKey: 'thk_lic_test_123',
    });

    const payload = await worker.collectPayload();
    expect(payload.license_key).toBe('thk_lic_test_123');
    expect(payload.total_sent_24h).toBe(2);
    expect(payload.failed_24h).toBe(1);
    expect(payload.active_accounts).toBe(1);
    expect(payload.machine_id).toBeDefined();
    expect(payload.is_break_glass).toBe(false);
  });

  it('should trigger remote lock on LicenseManager when ops portal returns REVOKED', async () => {
    const mockFetch = async () => {
      return new Response(
        JSON.stringify({
          status: 'REVOKED',
          lock_enforced: true,
          reason: 'Subscription expired or non-payment',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const worker = new TelemetryWorker(db, licenseManager, {
      licenseKey: 'thk_lic_test_123',
      fetchFn: mockFetch,
    });

    expect(licenseManager.isRemoteLocked()).toBe(false);

    const pingResult = await worker.sendPing();
    expect(pingResult.success).toBe(true);
    expect(pingResult.remoteLocked).toBe(true);
    expect(licenseManager.isRemoteLocked()).toBe(true);
    expect(licenseManager.getStatus()).toBe('REVOKED');
    expect(licenseManager.getTier()).toBe('COMMUNITY');
  });

  it('should fail-soft when telemetry portal returns network error', async () => {
    const mockFetchError = async () => {
      throw new Error('Connection refused or DNS resolution failed');
    };

    const worker = new TelemetryWorker(db, licenseManager, {
      licenseKey: 'thk_lic_test_123',
      fetchFn: mockFetchError,
    });

    const pingResult = await worker.sendPing();
    expect(pingResult.success).toBe(false);
    expect(pingResult.status).toBe('NETWORK_ERROR');
    // Engine must NOT be locked just because network is down
    expect(licenseManager.isRemoteLocked()).toBe(false);
  });

  it('should skip pinging when license_key is empty', async () => {
    const worker = new TelemetryWorker(db, licenseManager, {
      licenseKey: '',
    });

    const pingResult = await worker.sendPing();
    expect(pingResult.success).toBe(false);
    expect(pingResult.status).toBe('SKIPPED_NO_LICENSE');
  });
});
