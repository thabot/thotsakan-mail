import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createDocsRoute } from '../../src/api/routes/docs.route.js';

describe('Unit: API Documentation & OpenAPI Spec (/docs & /openapi.json)', () => {
  const app = new Hono();
  app.route('/', createDocsRoute());

  it('GET /openapi.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);

    const spec: any = await res.json();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toContain('Thotsakan Mail Engine');
    expect(spec.paths['/v1/emails/send']).toBeDefined();
    expect(spec.paths['/v1/accounts']).toBeDefined();
    expect(spec.paths['/v1/rules']).toBeDefined();
    expect(spec.paths['/v1/suppression']).toBeDefined();
    expect(spec.paths['/v1/queue/retry-failed']).toBeDefined();
    expect(spec.paths['/healthz']).toBeDefined();
  });

  it('GET /docs should render Swagger UI HTML interface', async () => {
    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('SwaggerUIBundle');
    expect(html).toContain('/openapi.json');
  });
});
