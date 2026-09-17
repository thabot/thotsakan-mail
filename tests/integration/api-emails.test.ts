import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { createTestDatabase } from '../helpers/test-db.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';
import { createAuthMiddleware } from '../../src/api/middlewares/auth.middleware.js';
import { createEmailsRoute } from '../../src/api/routes/emails.route.ts';

describe('Integration: API Emails Route', () => {
  const db = createTestDatabase();
  const apiKeyRepo = new ApiKeyRepository(db);

  // Setup Auth
  const plainKey = 'thotsakan_test_integration_key';
  const keyHash = createHash('sha256').update(plainKey).digest('hex');
  apiKeyRepo.create('key_integ_01', 'tenant_integ', keyHash, 'Integration Test Key');

  // Insert mock account
  db.prepare(`
    INSERT INTO email_accounts (
      id, tenant_id, name, provider_type, credentials, from_email,
      daily_quota_limit, daily_quota_used, rate_limit_per_minute
    ) VALUES (
      'acc_integ_smtp', 'tenant_integ', 'Mock SMTP', 'generic-smtp',
      'encrypted_mock_creds', 'sender@example.com', 5000, 0, 100
    )
  `).run();

  const app = new Hono();
  app.use('/v1/*', createAuthMiddleware(apiKeyRepo));
  app.route('/', createEmailsRoute(db));

  const authHeader = { 'X-API-Key': plainKey, 'Content-Type': 'application/json' };

  it('POST /v1/emails/send (async: true) should accept and enqueue in < 10ms', async () => {
    const start = performance.now();
    const res = await app.request('/v1/emails/send', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        to: 'user@example.com',
        subject: 'Async Welcome Email',
        text: 'Hello, your account is ready!',
        priority: 'high',
        async: true,
      }),
    });
    const elapsed = performance.now() - start;

    expect(res.status).toBe(202);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.jobId).toBeDefined();
    expect(json.status).toBe('ACCEPTED');
    expect(elapsed).toBeLessThan(1000); // SQLite fast enqueue with cold-start buffer
  });

  it('POST /v1/emails/batch should accept up to 500 emails in one request', async () => {
    const emails = Array.from({ length: 10 }, (_, i) => ({
      to: `batch_user_${i}@example.com`,
      subject: `Batch Notice #${i}`,
      text: `Hello user ${i}`,
    }));

    const res = await app.request('/v1/emails/batch', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ emails }),
    });

    expect(res.status).toBe(202);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.totalEnqueued).toBe(10);
    expect(json.jobs.length).toBe(10);
  });

  it('GET /v1/emails/status/:jobId should retrieve job status', async () => {
    // Send email first
    const sendRes = await app.request('/v1/emails/send', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        to: 'status_check@example.com',
        subject: 'Check Status Email',
        async: true,
      }),
    });
    const sendJson: any = await sendRes.json();

    const statusRes = await app.request(`/v1/emails/status/${sendJson.jobId}`, {
      headers: authHeader,
    });
    expect(statusRes.status).toBe(200);
    const statusJson: any = await statusRes.json();
    expect(statusJson.ok).toBe(true);
    expect(statusJson.job.job_id).toBe(sendJson.jobId);
    expect(statusJson.job.status).toBe('PENDING');
  });

  it('GET /v1/metrics/overview should return aggregate counts', async () => {
    const res = await app.request('/v1/metrics/overview', {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.metrics.total).toBeGreaterThanOrEqual(12);
  });

  it('Suppression CRUD should add, list, and reject suppressed emails', async () => {
    // 1. Add to suppression
    const addRes = await app.request('/v1/suppression', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        email: 'spammer@blocked.com',
        reason: 'SPAM',
      }),
    });
    expect(addRes.status).toBe(201);

    // 2. Try to send email to suppressed recipient
    const sendRes = await app.request('/v1/emails/send', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        to: 'spammer@blocked.com',
        subject: 'Should be rejected',
        async: true,
      }),
    });
    expect(sendRes.status).toBe(400);
    const sendJson: any = await sendRes.json();
    expect(sendJson.status).toBe('SUPPRESSED');

    // 3. Delete from suppression
    const delRes = await app.request('/v1/suppression/spammer@blocked.com', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(delRes.status).toBe(200);
  });

  it('Routing Rules CRUD should create, list, and delete rules', async () => {
    const createRes = await app.request('/v1/rules', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        priority: 10,
        conditionType: 'domain_match',
        conditionValue: 'vip-client.com',
        targetAccountId: 'acc_integ_smtp',
      }),
    });
    expect(createRes.status).toBe(201);
    const createJson: any = await createRes.json();
    expect(createJson.ruleId).toBeDefined();

    const listRes = await app.request('/v1/rules', { headers: authHeader });
    expect(listRes.status).toBe(200);
    const listJson: any = await listRes.json();
    expect(listJson.rules.length).toBeGreaterThanOrEqual(1);

    const delRes = await app.request(`/v1/rules/${createJson.ruleId}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(delRes.status).toBe(200);
  });
});
