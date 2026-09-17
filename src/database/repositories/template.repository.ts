import type { Database } from 'bun:sqlite';

export class TemplateRepository {
  constructor(private db: Database) {}

  public create(template: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    subjectTemplate: string;
    htmlContent: string;
    mjmlContent?: string;
    textContent?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO email_templates (id, tenant_id, code, name, subject_template, html_content, mjml_content, text_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      template.id,
      template.tenantId,
      template.code,
      template.name,
      template.subjectTemplate,
      template.htmlContent,
      template.mjmlContent || null,
      template.textContent || null
    );
  }

  public findByCode(tenantId: string, code: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM email_templates WHERE tenant_id = ? AND code = ?');
    return stmt.get(tenantId, code);
  }

  public listByTenant(tenantId: string): any[] {
    const stmt = this.db.prepare('SELECT * FROM email_templates WHERE tenant_id = ? ORDER BY created_at DESC');
    return stmt.all(tenantId);
  }

  public delete(tenantId: string, code: string): void {
    const stmt = this.db.prepare('DELETE FROM email_templates WHERE tenant_id = ? AND code = ?');
    stmt.run(tenantId, code);
  }
}
