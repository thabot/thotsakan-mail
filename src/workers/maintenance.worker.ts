import type { Database } from 'bun:sqlite';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export interface MaintenanceWorkerOptions {
  retentionDays?: number;
  backupDir?: string;
  intervalMs?: number;
}

export class MaintenanceWorker {
  private isRunning: boolean = false;
  private timer: any = null;
  private retentionDays: number;
  private backupDir: string;

  constructor(private db: Database, private options: MaintenanceWorkerOptions = {}) {
    this.retentionDays = options.retentionDays || 90;
    this.backupDir = options.backupDir || 'data/backups';
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const interval = this.options.intervalMs || 24 * 60 * 60 * 1000; // default once a day
    this.timer = setInterval(() => this.runMaintenance(), interval);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async runMaintenance(): Promise<{ purgedLogs: number; purgedIdempotency: number; backupPath?: string }> {
    // 1. Purge completed/failed logs older than retention days
    const purgeStmt = this.db.prepare(`
      DELETE FROM email_logs
      WHERE status IN ('SENT', 'FAILED', 'SUPPRESSED')
        AND datetime(created_at) < datetime('now', '-' || ? || ' days')
    `);
    const purgeResult = purgeStmt.run(this.retentionDays);
    const purgedLogs = purgeResult.changes;

    // 2. Purge expired idempotency keys
    const idempStmt = this.db.prepare(`
      DELETE FROM idempotency_keys
      WHERE datetime(expires_at) < datetime('now')
    `);
    const idempResult = idempStmt.run();
    const purgedIdempotency = idempResult.changes;

    // 3. Optimize database
    try {
      this.db.run('PRAGMA incremental_vacuum;');
      this.db.run('PRAGMA optimize;');
    } catch (err: any) {
      console.warn('[MaintenanceWorker] Pragma optimize error:', err.message);
    }

    // 4. Create Online Zero-Downtime SQLite Backup
    let backupPath: string | undefined;
    try {
      backupPath = this.createBackup();
      this.rotateBackups(7); // Keep last 7 backups
    } catch (err: any) {
      console.warn('[MaintenanceWorker] Online backup error:', err.message);
    }

    return { purgedLogs, purgedIdempotency, backupPath };
  }

  public createBackup(): string {
    mkdirSync(this.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.backupDir, `thotsakan-backup-${timestamp}.db`);

    // Normalize path for SQLite VACUUM INTO
    const normalized = backupFile.replace(/\\/g, '/');
    this.db.run(`VACUUM INTO '${normalized}';`);

    return backupFile;
  }

  public rotateBackups(keepMax: number = 7): void {
    try {
      mkdirSync(this.backupDir, { recursive: true });
      const files = readdirSync(this.backupDir)
        .filter((f) => f.startsWith('thotsakan-backup-') && f.endsWith('.db'))
        .map((f) => ({
          file: f,
          path: join(this.backupDir, f),
          mtime: statSync(join(this.backupDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime); // newest first

      if (files.length > keepMax) {
        const toDelete = files.slice(keepMax);
        for (const f of toDelete) {
          try {
            unlinkSync(f.path);
          } catch {}
        }
      }
    } catch (err: any) {
      console.warn('[MaintenanceWorker] Backup rotation error:', err.message);
    }
  }
}
