import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createTestDatabase } from '../helpers/test-db.js';
import { createEmailsRoute } from '../../src/api/routes/emails.route.js';

describe('Unit: Headless Accounts & Routing Rules Control API', () => {
  const db = createTestDatabase();
  const app = new Hono<{ Variables: { tenantId: string } }>();
  app.use('*', async (c, next) => {
    c.set('tenantId', 'test_tenant');
    await next();
  });
  app.route('/', createEmailsRoute(db));

  let createdAccountId = '';
  let createdRuleId = '';

  it('POST /v1/accounts should register new outbound account and encrypt credentials', async () => {
    const payload = {
      name: 'SES Production Cluster',
      providerType: 'aws-ses',
      fromEmail: 'noreply@example.com',
      fromName: 'Cluster Alert',
      dailyQuotaLimit: 20000,
      rateLimitPerMinute: 120,
      credentials: {
        accessKeyId: 'AKIA_TEST_123',
        secretAccessKey: 'SECRET_TEST_456',
        region: 'us-west-2',
      },
    };

    const res = await app.request('/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    expect(data.accountId).toBeDefined();
    createdAccountId = data.accountId;
  });

  it('GET /v1/accounts should list accounts with sanitized credentials', async () => {
    const res = await app.request('/v1/accounts');
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.accounts.length).toBeGreaterThan(0);
    expect(data.accounts[0].credentials).toBe('[ENCRYPTED]');
  });

  it('POST /v1/accounts/:id/test should verify provider connection adapter', async () => {
    const res = await app.request(`/v1/accounts/${createdAccountId}/test`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe('CONNECTED');
    expect(data.providerType).toBe('aws-ses');
  });

  it('POST /v1/rules should create a dynamic routing rule', async () => {
    const payload = {
      priority: 5,
      conditionType: 'domain_match',
      conditionValue: 'gmail.com',
      targetAccountId: createdAccountId,
      isActive: true,
    };

    const res = await app.request('/v1/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    expect(data.ruleId).toBeDefined();
    createdRuleId = data.ruleId;
  });

  it('PUT /v1/rules/:id should update rule configuration', async () => {
    const updatePayload = {
      priority: 99,
      isActive: false,
    };

    const res = await app.request(`/v1/rules/${createdRuleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ok).toBe(true);

    const listRes = await app.request('/v1/rules');
    const listData: any = await listRes.json();
    const updated = listData.rules.find((r: any) => r.id === createdRuleId);
    expect(updated.priority).toBe(99);
    expect(updated.is_active).toBe(0);
  });
});
