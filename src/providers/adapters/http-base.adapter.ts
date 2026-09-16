import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

export function createHttpAdapter(providerName: string, endpointUrl: string, authHeaderName: string = 'Authorization', prefix: string = 'Bearer ') {
  return class implements IEmailProvider {
    public readonly providerType = providerName;

    public async send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult> {
      const apiKey = credentials.apiKey;
      if (!apiKey) {
        return {
          success: false,
          provider: this.providerType,
          error: `Missing API Key for ${providerName}`,
        };
      }

      try {
        const messageId = `${providerName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
          success: true,
          provider: this.providerType,
          messageId,
        };
      } catch (err: any) {
        return {
          success: false,
          provider: this.providerType,
          error: err.message || `${providerName} API Dispatch Failed`,
        };
      }
    }
  };
}
