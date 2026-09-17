import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createTestDatabase } from '../helpers/test-db.js';
import { createEmailsRoute } from '../../src/api/routes/emails.route.js';

describe('Unit: Headless Suppression & Queue Maintenance Control API', () => {
  const db = createTestDatabase();
  const app = new Hono<{ Variables: { tenantId: string } }>();
  app.use('*', async (c, next) => {
    c.set('tenantId', 'test_tenant');
    await next();
  });
  app.route('/', createEmailsRoute(db));

  it('GET /v1/suppression/check/:email should check suppression status', async () => {
    const check1 = await app.request('/v1/suppression/check/user@test.com');
    const data1: any = await check1.json();
    expect(data1.isSuppressed).toBe(false);

    // Suppress email
    await app.request('/v1/suppression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@test.com', reason: 'BOUNCE' }),
    });

    const check2 = await app.request('/v1/suppression/check/user@test.com');
    const data2: any = await check2.json();
    expect(data2.isSuppressed).toBe(true);

    // Unsuppress
    await app.request('/v1/suppression/user@test.com', { method: 'DELETE' });

    const check3 = await app.request('/v1/suppression/check/user@test.com');
    const data3: any = await check3.json();
    expect(data3.isSuppressed).toBe(false);
  });

  it('POST /v1/queue/retry-failed and POST /v1/queue/purge-dead should manage queue state', async () => {
    // Insert a dummy failed job directly
    db.prepare(`
      INSERT INTO email_logs (job_id, tenant_id, to_recipients, subject, priority, status)
      VALUES ('job_failed_test', 'test_tenant', '["fail@example.com"]', 'Failed Subject', 'normal', 'FAILED')
    `).run();

    // Retry failed
    const retryRes = await app.request('/v1/queue/retry-failed', { method: 'POST' });
    expect(retryRes.status).toBe(200);
    const retryData: any = await retryRes.json();
    expect(retryData.ok).toBe(true);
    expect(retryData.retriedCount).toBe(1);

    // Make it failed again
    db.prepare("UPDATE email_logs SET status = 'FAILED' WHERE job_id = 'job_failed_test'").run();

    // Purge dead
    const purgeRes = await app.request('/v1/queue/purge-dead', { method: 'POST' });
    expect(purgeRes.status).toBe(200);
    const purgeData: any = await purgeRes.json();
    expect(purgeData.ok).toBe(true);
    expect(purgeData.purgedCount).toBe(1);
  });
});
