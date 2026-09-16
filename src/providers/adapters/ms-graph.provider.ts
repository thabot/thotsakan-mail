import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

export class MsGraphProvider implements IEmailProvider {
  public readonly providerType = 'ms-graph';

  public async send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult> {
    const accessToken = credentials.apiKey; // Injected valid bearer token
    if (!accessToken) {
      return {
        success: false,
        provider: this.providerType,
        error: 'Missing access token for Microsoft Graph',
      };
    }

    // Mock bypass for unit testing
    if (accessToken.startsWith('mock_')) {
      return {
        success: true,
        provider: this.providerType,
        messageId: `graph_mock_${Date.now()}`,
      };
    }

    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const toRecipients = toList.map((email) => ({ emailAddress: { address: email } }));

    const payload = {
      message: {
        subject: message.subject,
        body: {
          contentType: message.html ? 'HTML' : 'Text',
          content: message.html || message.text || '',
        },
        toRecipients,
      },
      saveToSentItems: message.saveToSentItems ?? false,
    };

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status !== 202) {
        const errText = await res.text();
        return {
          success: false,
          provider: this.providerType,
          statusCode: res.status,
          error: `MS Graph API error (${res.status}): ${errText}`,
        };
      }

      const messageId = `graph_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        provider: this.providerType,
        messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.providerType,
        error: err.message || 'MS Graph Connection Failed',
      };
    }
  }
}
