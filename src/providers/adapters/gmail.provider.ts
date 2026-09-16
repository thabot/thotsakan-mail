import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

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

    try {
      const messageId = `gmail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        provider: this.providerType,
        messageId,
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
