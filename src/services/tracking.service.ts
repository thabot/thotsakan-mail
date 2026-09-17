export class TrackingService {
  private baseUrl: string;

  constructor(customBaseUrl: string = 'http://localhost:3000') {
    this.baseUrl = customBaseUrl.replace(/\/$/, '');
  }

  /**
   * Inject invisible 1x1 tracking pixel before </body> or at the end of HTML
   */
  public injectOpenPixel(html: string, jobId: string): string {
    if (!html) return html;

    const pixelTag = `<img src="${this.baseUrl}/v1/track/open/${encodeURIComponent(jobId)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;" />`;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixelTag}</body>`);
    }
    return `${html}${pixelTag}`;
  }

  /**
   * Rewrite regular <a href="..."> links to go through click tracking redirect
   */
  public rewriteClickLinks(html: string, jobId: string): string {
    if (!html) return html;

    return html.replace(/<a\s+([^>]*?)href="([^"#][^"]*)"([^>]*)>/gi, (match, before, url, after) => {
      // Ignore mailto:, tel:, javascript:
      if (/^(mailto:|tel:|javascript:|#)/i.test(url)) {
        return match;
      }

      const encodedTarget = encodeURIComponent(url);
      const trackingUrl = `${this.baseUrl}/v1/track/click/${encodeURIComponent(jobId)}?url=${encodedTarget}`;

      return `<a ${before}href="${trackingUrl}"${after}>`;
    });
  }
}
