import { Hono } from 'hono';

export function createDocsRoute() {
  const app = new Hono();

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Thotsakan Mail Engine (ทศกัณฐ์) API',
      version: '1.0.0',
      description: '10-Headed Multi-Provider Transactional Email Dispatcher & Headless Management API with Smart Failover, Dynamic Routing, Priority Queue, and Deliverability Suite.',
      contact: {
        name: 'Thotsakan Mail Engine Team',
        url: 'https://github.com/thabot/thotsakan-mail',
      },
      license: {
        name: 'AGPLv3 / Commercial Dual License',
        url: 'https://github.com/thabot/thotsakan-mail#license',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment / Local Server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Pass your tenant Master or Standard API key (e.g. `thk_live_...`). Also accepts `Authorization: Bearer <API_KEY>`',
        },
      },
      schemas: {
        EmailSendRequest: {
          type: 'object',
          required: ['to'],
          properties: {
            to: {
              oneOf: [{ type: 'string', format: 'email' }, { type: 'array', items: { type: 'string', format: 'email' } }],
              example: 'customer@example.com',
            },
            subject: { type: 'string', example: 'Your Verification Code' },
            html: { type: 'string', example: '<h1>Hello</h1><p>Your OTP is <b>123456</b></p>' },
            text: { type: 'string', example: 'Your OTP is 123456' },
            priority: { type: 'string', enum: ['high', 'normal', 'low'], default: 'normal', example: 'high' },
            async: { type: 'boolean', default: true, description: 'True for fast enqueue (<5ms); False for immediate synchronous dispatch.' },
            accountId: { type: 'string', description: 'Explicit Outbound Account ID to dispatch from' },
            templateCode: { type: 'string', example: 'welcome_email' },
            templateData: { type: 'object', example: { name: 'Alice', code: '9821' } },
            delaySeconds: { type: 'integer', example: 60 },
          },
        },
        AccountCreateRequest: {
          type: 'object',
          required: ['name', 'providerType', 'fromEmail', 'credentials'],
          properties: {
            name: { type: 'string', example: 'AWS SES Production' },
            providerType: {
              type: 'string',
              enum: [
                'aws-ses', 'ms-graph', 'gmail', 'resend', 'postmark', 'sendgrid',
                'brevo', 'mailgun', 'scaleway', 'mailersend', 'zeptomail', 'sparkpost',
                'mandrill', 'generic-smtp',
              ],
              example: 'aws-ses',
            },
            fromEmail: { type: 'string', format: 'email', example: 'noreply@yourdomain.com' },
            fromName: { type: 'string', example: 'System Notification' },
            dailyQuotaLimit: { type: 'integer', default: 10000, example: 50000 },
            rateLimitPerMinute: { type: 'integer', default: 60, example: 300 },
            fallbackAccountId: { type: 'string' },
            credentials: {
              type: 'object',
              example: {
                accessKeyId: 'AKIA...',
                secretAccessKey: 'wJalr...',
                region: 'ap-southeast-1',
              },
            },
          },
        },
        RoutingRuleCreateRequest: {
          type: 'object',
          required: ['conditionType', 'conditionValue', 'targetAccountId'],
          properties: {
            priority: { type: 'integer', default: 0, example: 10 },
            conditionType: { type: 'string', enum: ['domain_match', 'subject_contains', 'recipient_regex'], example: 'domain_match' },
            conditionValue: { type: 'string', example: 'gmail.com' },
            targetAccountId: { type: 'string', example: 'acc_174244000_abc' },
            isActive: { type: 'boolean', default: true },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/healthz': {
        get: {
          summary: 'Container & Service Health Status',
          description: 'Docker container healthcheck probe endpoint with database connection verification',
          security: [],
          responses: {
            200: { description: 'Engine is healthy and operational' },
          },
        },
      },
      '/metrics/prometheus': {
        get: {
          summary: 'Prometheus Metrics Scraper Endpoint',
          description: 'Metrics for Grafana / Prometheus scraping (resident memory, active jobs, SQLite queue size)',
          security: [],
          responses: {
            200: { description: 'Plaintext Prometheus exposition format' },
          },
        },
      },
      '/v1/emails/send': {
        post: {
          summary: 'Dispatch Single Email (Sync or Async Queue)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/EmailSendRequest' } } },
          },
          responses: {
            200: { description: 'Email dispatched immediately in Sync mode' },
            202: { description: 'Email accepted into priority SQLite WAL queue' },
          },
        },
      },
      '/v1/emails/batch': {
        post: {
          summary: 'Dispatch Bulk Emails (Up to 500 in one transaction)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    emails: { type: 'array', items: { $ref: '#/components/schemas/EmailSendRequest' } },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: 'All emails successfully enqueued' },
          },
        },
      },
      '/v1/emails/status/{jobId}': {
        get: {
          summary: 'Get Job Dispatch Status',
          parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Job status retrieved' },
            404: { description: 'Job not found' },
          },
        },
      },
      '/v1/emails/logs': {
        get: {
          summary: 'Search & List Email Logs',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'recipient', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            200: { description: 'List of dispatch logs' },
          },
        },
      },
      '/v1/metrics/overview': {
        get: {
          summary: 'Get Real-time Dispatch Overview Counts',
          responses: {
            200: { description: 'Returns total, sent, failed, and pending job counts' },
          },
        },
      },
      '/v1/accounts': {
        get: {
          summary: 'List Outbound Sender Accounts',
          responses: { 200: { description: 'List of configured accounts' } },
        },
        post: {
          summary: 'Register New Outbound Sender Account',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountCreateRequest' } } },
          },
          responses: { 201: { description: 'Account registered' } },
        },
      },
      '/v1/accounts/{id}/test': {
        post: {
          summary: 'Test Account Connectivity & Credentials',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Provider adapter verified successfully' },
            500: { description: 'Connectivity or decryption failed' },
          },
        },
      },
      '/v1/rules': {
        get: {
          summary: 'List Dynamic Routing Rules',
          responses: { 200: { description: 'List of routing rules' } },
        },
        post: {
          summary: 'Create Dynamic Routing Rule',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RoutingRuleCreateRequest' } } },
          },
          responses: { 201: { description: 'Rule created' } },
        },
      },
      '/v1/rules/{id}': {
        put: {
          summary: 'Update Dynamic Routing Rule',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Rule updated' } },
        },
        delete: {
          summary: 'Delete Routing Rule',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Rule deleted' } },
        },
      },
      '/v1/suppression': {
        get: {
          summary: 'List Suppressed Email Addresses',
          responses: { 200: { description: 'Suppressed emails list' } },
        },
        post: {
          summary: 'Add Email to Suppression List',
          responses: { 201: { description: 'Email suppressed' } },
        },
      },
      '/v1/suppression/check/{email}': {
        get: {
          summary: 'Check if Single Email is Suppressed',
          parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Suppression status for email' } },
        },
      },
      '/v1/suppression/{email}': {
        delete: {
          summary: 'Remove Email from Suppression List (Unsuppress)',
          parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Email unsuppressed' } },
        },
      },
      '/v1/queue/retry-failed': {
        post: {
          summary: 'Re-queue All Failed Emails Back to Pending',
          responses: { 200: { description: 'Failed emails moved to PENDING' } },
        },
      },
      '/v1/queue/purge-dead': {
        post: {
          summary: 'Permanently Purge All Dead-Letter / Failed Emails',
          responses: { 200: { description: 'Dead jobs deleted' } },
        },
      },
    },
  };

  app.get('/openapi.json', (c) => {
    return c.json(openApiSpec);
  });

  app.get('/docs', (c) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Thotsakan Mail Engine - Interactive API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .wrapper { max-width: 1200px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.html(html);
  });

  return app;
}
