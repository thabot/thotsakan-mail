import type { EmailAttachment } from '../core/types/email.types.js';

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.vbs', '.sh', '.msi', '.scr', '.pif', '.com', '.cpl'
]);

const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

export class AttachmentGuardService {
  public static validate(attachments?: EmailAttachment[]): { valid: boolean; error?: string } {
    if (!attachments || attachments.length === 0) {
      return { valid: true };
    }

    let totalSizeBytes = 0;

    for (const file of attachments) {
      const extMatch = file.filename.match(/\.[^.]+$/);
      const ext = extMatch ? extMatch[0].toLowerCase() : '';

      if (BLOCKED_EXTENSIONS.has(ext)) {
        return {
          valid: false,
          error: `Blocked dangerous attachment file extension: "${ext}" in file "${file.filename}"`
        };
      }

      // Check estimated binary byte size
      const cleanContent = file.content.trim();
      let estimatedBytes = Buffer.byteLength(cleanContent, 'utf8');

      // If it looks like base64 with padding or typical base64 length
      if (cleanContent.length % 4 === 0 && (cleanContent.includes('=') || /^[A-Za-z0-9+/]+={0,2}$/.test(cleanContent))) {
        const padding = cleanContent.endsWith('==') ? 2 : cleanContent.endsWith('=') ? 1 : 0;
        estimatedBytes = (cleanContent.length * 3) / 4 - padding;
      }

      totalSizeBytes += estimatedBytes;
    }

    if (totalSizeBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return {
        valid: false,
        error: `Total attachment size exceeds 25 MB limit (Current estimated size: ${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB)`
      };
    }

    return { valid: true };
  }
}
