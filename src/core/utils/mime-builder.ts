import type { EmailMessage } from '../types/email.types.js';

export class MimeBuilder {
  public static buildRawMime(message: EmailMessage, defaultFrom?: string): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fromAddress = message.from || defaultFrom || 'noreply@localhost';
    const toAddresses = Array.isArray(message.to) ? message.to.join(', ') : message.to;

    const headers: string[] = [
      `From: ${fromAddress}`,
      `To: ${toAddresses}`,
      `Subject: =?UTF-8?B?${Buffer.from(message.subject || '').toString('base64')}?=`,
      'MIME-Version: 1.0',
    ];

    if (message.cc) {
      const cc = Array.isArray(message.cc) ? message.cc.join(', ') : message.cc;
      headers.push(`Cc: ${cc}`);
    }

    if (message.replyTo) {
      headers.push(`Reply-To: ${message.replyTo}`);
    }

    if (message.headers) {
      for (const [k, v] of Object.entries(message.headers)) {
        headers.push(`${k}: ${v}`);
      }
    }

    const hasAttachments = message.attachments && message.attachments.length > 0;

    if (!hasAttachments) {
      // Simple HTML / Plaintext
      if (message.html && message.text) {
        headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        const body = [
          headers.join('\r\n'),
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          Buffer.from(message.text).toString('base64'),
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          Buffer.from(message.html).toString('base64'),
          '',
          `--${boundary}--`,
        ].join('\r\n');
        return body;
      } else {
        const isHtml = !!message.html;
        headers.push(`Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8`);
        headers.push('Content-Transfer-Encoding: base64');
        return (
          headers.join('\r\n') +
          '\r\n\r\n' +
          Buffer.from(message.html || message.text || '').toString('base64')
        );
      }
    }

    // Multipart/mixed with attachments
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    const parts: string[] = [headers.join('\r\n'), '', `--${boundary}`];

    if (message.html) {
      parts.push(
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(message.html).toString('base64'),
        '',
        `--${boundary}`
      );
    } else {
      parts.push(
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(message.text || '').toString('base64'),
        '',
        `--${boundary}`
      );
    }

    for (let i = 0; i < message.attachments!.length; i++) {
      const att = message.attachments![i];
      const isLast = i === message.attachments!.length - 1;
      const contentType = att.contentType || 'application/octet-stream';
      const disposition = att.disposition || 'attachment';

      parts.push(
        `Content-Type: ${contentType}; name="${att.filename}"`,
        `Content-Disposition: ${disposition}; filename="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        att.content, // assumes base64
        '',
        isLast ? `--${boundary}--` : `--${boundary}`
      );
    }

    return parts.join('\r\n');
  }

  public static toBase64Url(rawMime: string): string {
    return Buffer.from(rawMime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
