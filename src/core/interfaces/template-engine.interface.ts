export interface ITemplateEngine {
  compile(templateString: string, data: Record<string, any>): string;
  renderMjml(mjmlString: string): string;
}
