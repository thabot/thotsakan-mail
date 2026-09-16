import { Hono } from 'hono';
import type { Database } from 'bun:sqlite';
import { AppLifecycleManager } from '../../core/lifecycle/lifecycle.manager.js';

export function createDevOpsRoute(db: Database) {
  const app = new Hono();

  app.get('/healthz', (c) => {
    let dbOk = false;
    try {
      db.run('SELECT 1;');
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const mem = process.memoryUsage();
    const activeJobs = AppLifecycleManager.getInstance().getActiveJobsCount();

    return c.json({
      status: dbOk ? 'healthy' : 'unhealthy',
      service: 'thotsakan-mail',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbOk ? 'connected' : 'error',
      activeJobs,
      memory: {
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
      },
    });
  });

  app.get('/metrics/prometheus', (c) => {
    const mem = process.memoryUsage();
    const activeJobs = AppLifecycleManager.getInstance().getActiveJobsCount();
    
    // In SQLite WAL mode, fetch queue counts
    let pendingCount = 0;
    try {
      const row: any = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'PENDING'").get();
      pendingCount = row ? row.count : 0;
    } catch {
      pendingCount = 0;
    }

    const metrics = [
      '# HELP thotsakan_process_resident_memory_bytes Resident memory size in bytes',
      '# TYPE thotsakan_process_resident_memory_bytes gauge',
      `thotsakan_process_resident_memory_bytes ${mem.rss}`,
      '# HELP thotsakan_active_jobs Number of currently executing in-flight jobs',
      '# TYPE thotsakan_active_jobs gauge',
      `thotsakan_active_jobs ${activeJobs}`,
      '# HELP thotsakan_queue_size Pending emails currently in SQLite queue',
      '# TYPE thotsakan_queue_size gauge',
      `thotsakan_queue_size{priority="all"} ${pendingCount}`
    ].join('\n') + '\n';

    c.header('Content-Type', 'text/plain; version=0.0.4');
    return c.text(metrics);
  });

  return app;
}
