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

  it('should interpolate single curly bracket variables {key} without corrupting CSS styles', () => {
    const template = '<table style="width:100%;color:{textColor};"><tr><td>Hello {customerName}, your total is {amount}</td></tr></table>';
    const rendered = engine.renderVariables(template, {
      customerName: 'Somchai',
      amount: '1,500 THB',
      textColor: '#006e63',
    });

    expect(rendered).toContain('style="width:100%;color:#006e63;"');
    expect(rendered).toContain('Hello Somchai, your total is 1,500 THB');
    expect(rendered).not.toContain('{customerName}');
    expect(rendered).not.toContain('{amount}');
    expect(rendered).not.toContain('{textColor}');
  });

  it('should seamlessly render sanitized multi-variable legacy invoice template with dynamic HTML rows', () => {
    // Sanitized template based on legacy structure with mock data
    const rawTemplate = `
<html>
  <body>
    <table align="center" style="width:100%;max-width:630px;background-color: white;">
      <tr>
        <td colspan="12">
          <div style="text-align:center;"><a href="{bulink}" target="_blank"><img src="{bulogo}" height="50" alt=""></a></div>
        </td>
      </tr>
      <tr>
        <td colspan="12">
          <div style="padding:.5em 0;font-size:1.2em;font-weight:600;margin:1em .8em 0 .8em;">สวัสดี {customername}</div>
        </td>
      </tr>
      <tr>
        <td colspan="4" style="text-align: center;"> <img src="{etaxlogo}" width="100" alt=""> </td>
        <td colspan="8">
          <div style="font-size:1em">
            <span style="font-weight:600;">ขอบคุณครับ! สำหรับการซื้อสินค้าและบริการจาก{buname}</span> <br>
            ทางบริษัทฯได้ออก <span style="font-weight:600;color: {bucolor};">ใบกำกับภาษีอิเล็กทรอนิกส์</span>
            สำหรับคำสั่งซื้อหมายเลข <span style="font-weight:600">{weborderno}</span> จำนวน {nooffile} ใบ
          </div>
        </td>
      </tr>
      {trreqtax}
    </table>
  </body>
</html>`;

    const mockConfigData = {
      buname: 'ตัวอย่างร้านค้าตัวอย่าง (Demo Store)',
      bulink: 'https://example.com',
      bulogo: 'https://example.com/assets/logo.png',
      bucolor: '#006e63',
      etaxlogo: 'https://example.com/assets/etax.png',
      customername: 'คุณสมชาย ตัวอย่างดี',
      weborderno: 'ORD-2026-9901',
      nooffile: '1',
      trreqtax: '<tr><td colspan="12"><div>เอกสารแนบพร้อมใช้งาน</div></td></tr>',
    };

    const result = engine.renderVariables(rawTemplate, mockConfigData);

    // Assertions
    expect(result).toContain('https://example.com/assets/logo.png');
    expect(result).toContain('สวัสดี คุณสมชาย ตัวอย่างดี');
    expect(result).toContain('การซื้อสินค้าและบริการจากตัวอย่างร้านค้าตัวอย่าง (Demo Store)');
    expect(result).toContain('ORD-2026-9901');
    expect(result).toContain('color: #006e63;');
    expect(result).toContain('<tr><td colspan="12"><div>เอกสารแนบพร้อมใช้งาน</div></td></tr>');
    expect(result).not.toContain('{customername}');
    expect(result).not.toContain('{weborderno}');
    expect(result).not.toContain('{buname}');
    expect(result).not.toContain('{trreqtax}');
  });
});

