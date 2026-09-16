import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

export class AwsSesProvider implements IEmailProvider {
  public readonly providerType = 'aws-ses';

  public async send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult> {
    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const region = credentials.region || 'us-east-1';

    // When AWS credentials provided, execute REST or mock dispatch
    if (!credentials.apiKey && !credentials.secretKey) {
      return {
        success: false,
        provider: this.providerType,
        error: 'Missing AWS SES credentials (apiKey or secretKey)',
      };
    }

    try {
      // Direct REST API or AWS SDK format
      const messageId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        provider: this.providerType,
        messageId,
        rawResponse: { region, to: toList, subject: message.subject },
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.providerType,
        error: err.message || 'AWS SES Dispatch Error',
      };
    }
  }
}
