import type { Database } from 'bun:sqlite';
import { TemplateRepository } from '../database/repositories/template.repository.js';

export class TemplateEngineService {
  private templateRepo: TemplateRepository;

  constructor(private db: Database) {
    this.templateRepo = new TemplateRepository(db);
  }

  /**
   * Render dynamic variables {{key}} in template text
   */
  public renderVariables(template: string, data: Record<string, any> = {}): string {
    if (!template) return '';

    // Handle {{#if cond}} ... {{/if}}
    let rendered = template.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, block) => {
      const val = this.getNestedValue(data, key);
      return val ? block : '';
    });

    // Handle {{#each list}} ... {{/each}}
    rendered = rendered.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, block) => {
      const list = this.getNestedValue(data, key);
      if (!Array.isArray(list)) return '';
      return list.map((item) => {
        let itemBlock = block;
        if (typeof item === 'object' && item !== null) {
          itemBlock = itemBlock.replace(/\{\{this\.([\w.]+)\}\}/g, (__: string, itemKey: string) => {
            return String(this.getNestedValue(item, itemKey) ?? '');
          });
        }
        itemBlock = itemBlock.replace(/\{\{this\}\}/g, String(item));
        return itemBlock;
      }).join('');
    });

    // Handle simple {{key}}
    rendered = rendered.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
      const val = this.getNestedValue(data, key.trim());
      return val !== undefined && val !== null ? String(val) : '';
    });

    return rendered;
  }

  /**
   * Compile MJML markup into responsive HTML
   */
  public compileMjml(mjmlString: string): string {
    if (!mjmlString) return '';

    // Transform MJML tags to standard responsive HTML email table structures
    let html = mjmlString;
    html = html.replace(/<mj-body[^>]*>([\s\S]*?)<\/mj-body>/gi, (_, body) => {
      return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;"><tr><td>${body}</td></tr></table>`;
    });

    html = html.replace(/<mj-section[^>]*>([\s\S]*?)<\/mj-section>/gi, (_, sec) => {
      return `<div style="width:100%;margin-bottom:16px;">${sec}</div>`;
    });

    html = html.replace(/<mj-column[^>]*>([\s\S]*?)<\/mj-column>/gi, (_, col) => {
      return `<div style="display:inline-block;width:100%;vertical-align:top;">${col}</div>`;
    });

    html = html.replace(/<mj-text([^>]*)>([\s\S]*?)<\/mj-text>/gi, (_, attrs, text) => {
      return `<div style="font-size:15px;line-height:1.6;color:#333333;margin:8px 0;">${text}</div>`;
    });

    html = html.replace(/<mj-button\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/mj-button>/gi, (_, href, text) => {
      return `<a href="${href}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:12px 0;">${text}</a>`;
    });

    // Strip out remaining mjml wrappers
    html = html.replace(/<\/?mjml[^>]*>/gi, '');
    html = html.replace(/<mj-head>[\s\S]*?<\/mj-head>/gi, '');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:20px;background-color:#f4f6f8;">${html}</body></html>`;
  }

  /**
   * Render template by code and tenantId
   */
  public renderByCode(
    tenantId: string,
    code: string,
    data: Record<string, any> = {}
  ): { subject: string; html: string; text?: string } | null {
    const tpl = this.templateRepo.findByCode(tenantId, code);
    if (!tpl) return null;

    let htmlTemplate = tpl.html_content;
    if (tpl.mjml_content) {
      htmlTemplate = this.compileMjml(tpl.mjml_content);
    }

    const subject = this.renderVariables(tpl.subject_template, data);
    const html = this.renderVariables(htmlTemplate, data);
    const text = tpl.text_content ? this.renderVariables(tpl.text_content, data) : undefined;

    return { subject, html, text };
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);
  }
}
