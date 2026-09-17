import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Database } from 'bun:sqlite';
import { TemplateRepository } from '../../database/repositories/template.repository.js';
import { TemplateEngineService } from '../../services/template-engine.service.js';

type TemplateEnv = {
  Variables: {
    tenantId: string;
    apiKeyId: string;
  };
};

const CreateTemplateSchema = z.object({
  code: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Template code can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().min(1),
  subjectTemplate: z.string().min(1),
  htmlContent: z.string().min(1),
  mjmlContent: z.string().optional(),
  textContent: z.string().optional(),
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subjectTemplate: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  mjmlContent: z.string().optional(),
  textContent: z.string().optional(),
});

const RenderTemplateSchema = z.object({
  data: z.record(z.any()).default({}),
});

export function createTemplatesRoute(db: Database) {
  const app = new Hono<TemplateEnv>();
  const repo = new TemplateRepository(db);
  const engine = new TemplateEngineService(db);

  // 1. GET /v1/templates - list all templates
  app.get('/v1/templates', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const templates = repo.listByTenant(tenantId);
    return c.json({ ok: true, templates });
  });

  // 2. GET /v1/templates/:code - get specific template
  app.get('/v1/templates/:code', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const code = c.req.param('code');
    const template = repo.findByCode(tenantId, code);
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }
    return c.json({ ok: true, template });
  });

  // 3. POST /v1/templates - create template
  app.post('/v1/templates', zValidator('json', CreateTemplateSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const body = c.req.valid('json');
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      repo.create({
        id: templateId,
        tenantId,
        code: body.code,
        name: body.name,
        subjectTemplate: body.subjectTemplate,
        htmlContent: body.htmlContent,
        mjmlContent: body.mjmlContent,
        textContent: body.textContent,
      });
      return c.json({ ok: true, templateId, message: 'Template created successfully' }, 201);
    } catch (err: any) {
      return c.json({ error: `Failed to create template: ${err.message}` }, 400);
    }
  });

  // 4. PUT /v1/templates/:code - update existing template
  app.put('/v1/templates/:code', zValidator('json', UpdateTemplateSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const code = c.req.param('code');
    const body = c.req.valid('json');

    const updated = repo.update(tenantId, code, body);
    if (!updated) {
      return c.json({ error: 'Template not found' }, 404);
    }
    return c.json({ ok: true, message: `Template ${code} updated successfully` });
  });

  // 5. POST /v1/templates/:code/preview - render preview with mock data
  app.post('/v1/templates/:code/preview', zValidator('json', RenderTemplateSchema), (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const code = c.req.param('code');
    const { data } = c.req.valid('json');

    const rendered = engine.renderByCode(tenantId, code, data);
    if (!rendered) {
      return c.json({ error: 'Template not found' }, 404);
    }

    return c.json({ ok: true, ...rendered });
  });

  // 6. DELETE /v1/templates/:code - delete template
  app.delete('/v1/templates/:code', (c) => {
    const tenantId = c.get('tenantId') || 'default_tenant';
    const code = c.req.param('code');
    repo.delete(tenantId, code);
    return c.json({ ok: true, message: `Template ${code} deleted` });
  });

  return app;
}
