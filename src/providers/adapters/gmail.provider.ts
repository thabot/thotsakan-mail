import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';
import { MimeBuilder } from '../../core/utils/mime-builder.js';

export class GmailProvider implements IEmailProvider {
  public readonly providerType = 'gmail';

  public async send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult> {
    const accessToken = credentials.apiKey;
    if (!accessToken) {
      return {
        success: false,
        provider: this.providerType,
        error: 'Missing access token for Gmail API',
      };
    }

    // Mock bypass for testing
    if (accessToken.startsWith('mock_') || process.env.NODE_ENV === 'test') {
      return {
        success: true,
        provider: this.providerType,
        messageId: `gmail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
    }

    try {
      const rawMime = MimeBuilder.buildRawMime(message);
      const rawBase64Url = MimeBuilder.toBase64Url(rawMime);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawBase64Url }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          provider: this.providerType,
          statusCode: res.status,
          error: `Gmail API error (${res.status}): ${errText}`,
        };
      }

      const data: any = await res.json();
      return {
        success: true,
        provider: this.providerType,
        messageId: data.id || `gmail_${Date.now()}`,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.providerType,
        error: err.message || 'Gmail API Error',
      };
    }
  }
}
