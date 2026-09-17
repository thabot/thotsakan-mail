import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { MaintenanceWorker } from '../../src/workers/maintenance.worker.js';
import { existsSync } from 'node:fs';

describe('Unit: MaintenanceWorker (Auto-Retention & Online Backup)', () => {
  const db = createTestDatabase();
  const worker = new MaintenanceWorker(db, {
    retentionDays: 30,
    backupDir: 'data/test-backups',
  });

  it('should purge logs older than retention days and expired idempotency keys', async () => {
    // Insert old sent log (60 days ago)
    db.prepare(`
      INSERT INTO email_logs (job_id, tenant_id, to_recipients, subject, status, created_at)
      VALUES ('job_old', 'tenant_m', '[]', 'Old Log', 'SENT', datetime('now', '-60 days'))
    `).run();

    // Insert recent log (today)
    db.prepare(`
      INSERT INTO email_logs (job_id, tenant_id, to_recipients, subject, status, created_at)
      VALUES ('job_recent', 'tenant_m', '[]', 'Recent Log', 'SENT', datetime('now'))
    `).run();

    // Insert expired idempotency key
    db.prepare(`
      INSERT INTO idempotency_keys (key, tenant_id, response_status, response_body, expires_at)
      VALUES ('expired_key', 'tenant_m', 200, '{}', datetime('now', '-2 days'))
    `).run();

    const result = await worker.runMaintenance();

    expect(result.purgedLogs).toBe(1);
    expect(result.purgedIdempotency).toBe(1);
    expect(result.backupPath).toBeDefined();
    expect(existsSync(result.backupPath!)).toBe(true);

    // Verify recent log is preserved
    const preserved = db.prepare('SELECT job_id FROM email_logs WHERE job_id = ?').get('job_recent');
    expect(preserved).not.toBeNull();
  });
});
