import { describe, expect, it } from 'bun:test';
import { TrackingService } from '../../src/services/tracking.service.js';

describe('Unit: TrackingService (Open & Click Tracking)', () => {
  const tracking = new TrackingService('http://localhost:9547');

  it('should inject 1x1 transparent open pixel before </body> tag', () => {
    const html = '<html><body><h1>Hello</h1></body></html>';
    const output = tracking.injectOpenPixel(html, 'job_abc_123');

    expect(output).toContain('/v1/track/open/job_abc_123');
    expect(output).toContain('<img src=');
    expect(output).toContain('</body></html>');
  });

  it('should append pixel at the end if </body> tag is missing', () => {
    const html = '<div>Simple body</div>';
    const output = tracking.injectOpenPixel(html, 'job_xyz_789');

    expect(output).toContain('/v1/track/open/job_xyz_789');
    expect(output.endsWith('/>')).toBe(true);
  });

  it('should rewrite hyperlinks into tracking proxy links', () => {
    const html = '<p>Click <a href="https://example.com/checkout">Here</a> to pay.</p>';
    const output = tracking.rewriteClickLinks(html, 'job_click_1');

    expect(output).toContain('/v1/track/click/job_click_1?url=https%3A%2F%2Fexample.com%2Fcheckout');
  });

  it('should not rewrite mailto or anchor links', () => {
    const html = '<p><a href="mailto:support@example.com">Email Us</a> or <a href="#section">Jump</a></p>';
    const output = tracking.rewriteClickLinks(html, 'job_click_2');

    expect(output).toContain('href="mailto:support@example.com"');
    expect(output).toContain('href="#section"');
  });
});
