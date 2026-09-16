import { describe, expect, it } from 'bun:test';
import { AttachmentGuardService } from '../../src/services/attachment-guard.service.js';

describe('AttachmentGuardService', () => {
  it('should allow valid safe attachments (pdf, png, jpg)', () => {
    const result = AttachmentGuardService.validate([
      { filename: 'invoice.pdf', content: 'SGVsbG8gV29ybGQ=' },
      { filename: 'logo.png', content: 'iVBORw0KGgoAAAANSUhEUgAAAAE=' }
    ]);
    expect(result.valid).toBe(true);
  });

  it('should block dangerous file extensions (.exe, .bat, .sh)', () => {
    const exeResult = AttachmentGuardService.validate([
      { filename: 'malware.exe', content: 'TVqQAAMAAAAEAAAA//8=' }
    ]);
    expect(exeResult.valid).toBe(false);
    expect(exeResult.error).toContain('.exe');

    const batResult = AttachmentGuardService.validate([
      { filename: 'script.BAT', content: '@echo off' }
    ]);
    expect(batResult.valid).toBe(false);
    expect(batResult.error).toContain('.bat');
  });

  it('should block attachments exceeding 25 MB limit', () => {
    // 35 MB base64 or 26 MB raw binary
    const largeContent = 'A'.repeat(35 * 1024 * 1024);
    const result = AttachmentGuardService.validate([
      { filename: 'huge.pdf', content: largeContent }
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('25 MB');
  });
});
