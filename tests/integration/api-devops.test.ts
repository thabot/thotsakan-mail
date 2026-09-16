import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createTestDatabase } from '../helpers/test-db.js';
import { createDevOpsRoute } from '../../src/api/routes/devops.route.js';

describe('Integration: DevOps Route (/healthz & /metrics/prometheus)', () => {
  const db = createTestDatabase();
  const app = new Hono();
  app.route('/', createDevOpsRoute(db));

  it('GET /healthz should return 200 with service health stats', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.status).toBe('healthy');
    expect(json.service).toBe('thotsakan-mail');
    expect(json.database).toBe('connected');
    expect(typeof json.memory.rssMb).toBe('number');
  });

  it('GET /metrics/prometheus should return standard prometheus metrics', async () => {
    const res = await app.request('/metrics/prometheus');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('thotsakan_process_resident_memory_bytes');
    expect(text).toContain('thotsakan_queue_size');
  });
});
