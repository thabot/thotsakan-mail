import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { createTestDatabase } from '../helpers/test-db.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';
import { createAuthMiddleware } from '../../src/api/middlewares/auth.middleware.js';
import { createTemplatesRoute } from '../../src/api/routes/templates.route.js';
import { createTrackingRoute } from '../../src/api/routes/tracking.route.js';
import { createWebhooksRoute } from '../../src/api/routes/webhooks.route.js';
import { createWebUIRoute } from '../../src/ui/ui.route.js';

describe('Integration: Phase 4 Web UI, Templates, Tracking & Webhooks Routes', () => {
  const db = createTestDatabase();
  const apiKeyRepo = new ApiKeyRepository(db);

  const plainKey = 'thotsakan_phase4_test_key';
  const keyHash = createHash('sha256').update(plainKey).digest('hex');
  apiKeyRepo.create('key_p4', 'tenant_p4', keyHash, 'Phase 4 Key');

  const app = new Hono();
  // Public routes
  app.route('/', createWebUIRoute());
  app.route('/', createTrackingRoute(db));
  app.route('/', createWebhooksRoute(db));

  // Authenticated routes
  const authGroup = new Hono();
  authGroup.use('*', createAuthMiddleware(apiKeyRepo));
  authGroup.route('/', createTemplatesRoute(db));
  app.route('/', authGroup);

  const authHeaders = { 'X-API-Key': plainKey, 'Content-Type': 'application/json' };

  it('GET / and /console should return Web UI HTML dashboard', async () => {
    const res = await app.request('/console');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Thotsakan Mail Engine');
    expect(html).toContain('Quick Send Playground');
    expect(html).toContain('One-Click DNS Verify');
  });

  it('Template CRUD and Preview rendering', async () => {
    // Create template
    const createRes = await app.request('/v1/templates', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        code: 'invoice_receipt',
        name: 'Invoice Receipt',
        subjectTemplate: 'Invoice #{{invoiceId}} for {{customer}}',
        htmlContent: '<p>Total amount: <b>${{amount}}</b></p>',
      }),
    });
    expect(createRes.status).toBe(201);

    // Preview template
    const previewRes = await app.request('/v1/templates/invoice_receipt/preview', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        data: { invoiceId: 'INV-99', customer: 'John Doe', amount: 150 },
      }),
    });
    expect(previewRes.status).toBe(200);
    const previewJson: any = await previewRes.json();
    expect(previewJson.subject).toBe('Invoice #INV-99 for John Doe');
    expect(previewJson.html).toContain('Total amount: <b>$150</b>');
  });

  it('Tracking Open Pixel should record open and return transparent GIF', async () => {
    // Insert log to track
    db.prepare(`
      INSERT INTO email_logs (job_id, tenant_id, to_recipients, subject, status)
      VALUES ('job_pixel_test', 'tenant_p4', '[]', 'Subject', 'SENT')
    `).run();

    const res = await app.request('/v1/track/open/job_pixel_test');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/gif');

    const row: any = db.prepare('SELECT open_count FROM email_logs WHERE job_id = ?').get('job_pixel_test');
    expect(row.open_count).toBe(1);
  });

  it('Tracking Click Redirect should record click and redirect with 302', async () => {
    const res = await app.request('/v1/track/click/job_pixel_test?url=https%3A%2F%2Fcompany.com%2Fpromo');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://company.com/promo');

    const row: any = db.prepare('SELECT click_count FROM email_logs WHERE job_id = ?').get('job_pixel_test');
    expect(row.click_count).toBe(1);
  });

  it('Webhooks AWS SES should process bounce and complaint events', async () => {
    const bouncePayload = {
      Type: 'Notification',
      Message: JSON.stringify({
        notificationType: 'Bounce',
        bounce: {
          bounceType: 'Permanent',
          bouncedRecipients: [{ emailAddress: 'hardbounce@example.com' }],
        },
      }),
    };

    const res = await app.request('/v1/webhooks/aws-ses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bouncePayload),
    });
    expect(res.status).toBe(200);

    // Verify suppressed
    const isSuppressed: any = db.prepare('SELECT 1 FROM suppression_list WHERE email = ?').get('hardbounce@example.com');
    expect(isSuppressed).not.toBeNull();
  });
});
