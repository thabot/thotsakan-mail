import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { TemplateEngineService } from '../../src/services/template-engine.service.js';
import { TemplateRepository } from '../../src/database/repositories/template.repository.js';

describe('Unit: TemplateEngineService (Handlebars & MJML)', () => {
  const db = createTestDatabase();
  const repo = new TemplateRepository(db);
  const engine = new TemplateEngineService(db);

  it('should interpolate simple variables {{key}}', () => {
    const template = 'Hello, {{name}}! Welcome to {{company}}.';
    const rendered = engine.renderVariables(template, { name: 'Alice', company: 'Acme Corp' });
    expect(rendered).toBe('Hello, Alice! Welcome to Acme Corp.');
  });

  it('should handle conditional blocks {{#if condition}}', () => {
    const template = 'Status: {{#if isVip}}VIP Member{{/if}}';
    const v1 = engine.renderVariables(template, { isVip: true });
    expect(v1).toBe('Status: VIP Member');

    const v2 = engine.renderVariables(template, { isVip: false });
    expect(v2).toBe('Status: ');
  });

  it('should handle loop blocks {{#each items}}', () => {
    const template = 'Items: {{#each items}}[{{this}}] {{/each}}';
    const rendered = engine.renderVariables(template, { items: ['Apple', 'Banana'] });
    expect(rendered).toBe('Items: [Apple] [Banana] ');
  });

  it('should compile MJML to responsive HTML email markup', () => {
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello world</mj-text>
              <mj-button href="https://example.com">Click Me</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    const html = engine.compileMjml(mjml);
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Hello world');
    expect(html).toContain('https://example.com');
  });

  it('should render template by code from repository', () => {
    repo.create({
      id: 'tpl_welcome',
      tenantId: 'tenant_t',
      code: 'welcome_email',
      name: 'Welcome Email',
      subjectTemplate: 'Welcome, {{user}}!',
      htmlContent: '<h1>Welcome {{user}} to {{app}}</h1>',
    });

    const rendered = engine.renderByCode('tenant_t', 'welcome_email', {
      user: 'Bob',
      app: 'Thotsakan',
    });

    expect(rendered).not.toBeNull();
    expect(rendered?.subject).toBe('Welcome, Bob!');
    expect(rendered?.html).toBe('<h1>Welcome Bob to Thotsakan</h1>');
  });
});
