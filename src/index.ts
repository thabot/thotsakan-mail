import { Hono } from 'hono';
import { getDatabase, runMigrations } from './database/db.js';
import { getEnv } from './config/env.js';
import { AppLifecycleManager } from './core/lifecycle/lifecycle.manager.js';
import { LicenseManagerService } from './services/license-manager.service.js';
import { FeatureGateService } from './services/feature-gate.service.js';
import { ApiKeyRepository } from './database/repositories/api-key.repository.js';
import { createAuthMiddleware } from './api/middlewares/auth.middleware.js';
import { errorHandler } from './api/middlewares/error.middleware.js';
import { createDevOpsRoute } from './api/routes/devops.route.js';
import { createLicenseRoute } from './api/routes/license.route.js';
import { createEmailsRoute } from './api/routes/emails.route.js';
import { createTemplatesRoute } from './api/routes/templates.route.js';
import { createTrackingRoute } from './api/routes/tracking.route.js';
import { createWebhooksRoute } from './api/routes/webhooks.route.js';
import { createDocsRoute } from './api/routes/docs.route.js';
import { createWebUIRoute } from './ui/ui.route.js';
import { QueueWorker } from './workers/queue.worker.js';
import { MaintenanceWorker } from './workers/maintenance.worker.js';

// 1. Initialize Database & Migrations
const env = getEnv();
const db = getDatabase(env.DB_PATH);
runMigrations(db);

// 2. Initialize Services & Repositories
const apiKeyRepo = new ApiKeyRepository(db);
const licenseManager = new LicenseManagerService(env.LICENSE_KEY);
const featureGate = new FeatureGateService(licenseManager);

// First-Boot Zero-Config Key Provisioning
if (process.env.NODE_ENV !== 'test' && apiKeyRepo.countTotalKeys() === 0) {
  const masterSecret = `thk_live_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(masterSecret);
  const hash = hasher.digest('hex');
  apiKeyRepo.create('key_master_admin', 'default_tenant', hash, 'First Boot Master Key');

  console.log('\n' + '='.repeat(70));
  console.log('🎉 [FIRST BOOT] Thotsakan Mail Engine Initialized!');
  console.log('🔑 Master API Key Provisioned Automatically:');
  console.log(`   👉 ${masterSecret}`);
  console.log('   Save this key securely! Pass it as: Authorization: Bearer <KEY> or X-API-Key: <KEY>');
  console.log(`   Interactive Web Console: http://localhost:${env.PORT}`);
  console.log(`   Interactive API Docs:    http://localhost:${env.PORT}/docs`);
  console.log('='.repeat(70) + '\n');
}

// 3. Initialize Background Workers
const queueWorker = new QueueWorker(db, { pollingIntervalMs: 1000, batchSize: 20 });
const maintenanceWorker = new MaintenanceWorker(db, {
  retentionDays: env.LOG_RETENTION_DAYS,
  backupDir: 'data/backups',
  intervalMs: 24 * 60 * 60 * 1000,
});

queueWorker.start();
maintenanceWorker.start();

// 4. Register Graceful Shutdown
const lifecycle = AppLifecycleManager.getInstance();
lifecycle.registerCleanupHandler(async () => {
  console.log('Stopping Queue & Maintenance Workers...');
  queueWorker.stop();
  maintenanceWorker.stop();
});

// 5. Build Hono Application
const app = new Hono();

// Global Error Handler
app.onError(errorHandler);

// Public Routes (Web UI, API Docs, DevOps, Tracking Pixels, Webhooks)
app.route('/', createWebUIRoute());
app.route('/', createDocsRoute());
app.route('/', createDevOpsRoute(db));
app.route('/', createTrackingRoute(db));
app.route('/', createWebhooksRoute(db));

// License Management Route
app.route('/', createLicenseRoute(licenseManager, featureGate));

// Authenticated API Routes (Emails & Templates)
const api = new Hono();
api.use('*', createAuthMiddleware(apiKeyRepo));
api.route('/', createEmailsRoute(db));
api.route('/', createTemplatesRoute(db));

app.route('/', api);

console.log(`🚀 Thotsakan Mail Engine running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
