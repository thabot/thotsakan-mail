import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { createTestDatabase } from '../helpers/test-db.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';
import { createAuthMiddleware } from '../../src/api/middlewares/auth.middleware.js';

describe('Integration: API Authentication Middleware', () => {
  const db = createTestDatabase();
  const apiKeyRepo = new ApiKeyRepository(db);

  // Setup sample valid key
  const plainKey = 'thotsakan_test_key_123456';
  const keyHash = createHash('sha256').update(plainKey).digest('hex');
  apiKeyRepo.create('key_01', 'tenant_test', keyHash, 'Dev Key');

  type Variables = {
    tenantId: string;
    apiKeyId: string;
  };

  const app = new Hono<{ Variables: Variables }>();
  app.use('*', createAuthMiddleware(apiKeyRepo));
  app.get('/protected', (c) => c.json({ ok: true, tenant: c.get('tenantId') }));

  it('should reject request without X-API-Key header with 401', async () => {
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toContain('Missing X-API-Key');
  });

  it('should reject request with invalid X-API-Key header with 401', async () => {
    const res = await app.request('/protected', {
      headers: { 'X-API-Key': 'invalid_secret_key' },
    });
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toContain('Invalid or revoked API key');
  });

  it('should allow request with valid X-API-Key header', async () => {
    const res = await app.request('/protected', {
      headers: { 'X-API-Key': plainKey },
    });
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tenant).toBe('tenant_test');
  });
});
