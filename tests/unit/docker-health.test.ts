import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createTestDatabase } from '../helpers/test-db.js';
import { createDevOpsRoute } from '../../src/api/routes/devops.route.js';

describe('Unit: Container Healthcheck Endpoint (/healthz)', () => {
  const db = createTestDatabase();
  const app = new Hono();
  app.route('/', createDevOpsRoute(db));

  it('GET /healthz should return 200 OK and healthy status for Docker Healthcheck', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
    expect(data.uptimeSeconds).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});
