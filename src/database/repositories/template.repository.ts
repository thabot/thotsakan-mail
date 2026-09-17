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

  public update(
    tenantId: string,
    code: string,
    updates: {
      name?: string;
      subjectTemplate?: string;
      htmlContent?: string;
      mjmlContent?: string;
      textContent?: string;
    }
  ): boolean {
    const existing = this.findByCode(tenantId, code);
    if (!existing) return false;

    const stmt = this.db.prepare(`
      UPDATE email_templates
      SET name = coalesce(?, name),
          subject_template = coalesce(?, subject_template),
          html_content = coalesce(?, html_content),
          mjml_content = coalesce(?, mjml_content),
          text_content = coalesce(?, text_content),
          updated_at = datetime('now')
      WHERE tenant_id = ? AND code = ?
    `);

    stmt.run(
      updates.name ?? null,
      updates.subjectTemplate ?? null,
      updates.htmlContent ?? null,
      updates.mjmlContent ?? null,
      updates.textContent ?? null,
      tenantId,
      code
    );
    return true;
  }

  public delete(tenantId: string, code: string): void {
    const stmt = this.db.prepare('DELETE FROM email_templates WHERE tenant_id = ? AND code = ?');
    stmt.run(tenantId, code);
  }
}
