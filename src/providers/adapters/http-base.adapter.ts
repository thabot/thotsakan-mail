import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

export function createHttpAdapter(
  providerName: string,
  endpointUrl: string,
  authHeaderName: string = 'Authorization',
  prefix: string = 'Bearer ',
  payloadFormatter?: (message: EmailMessage, credentials: ProviderCredentials) => any
) {
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

      // Mock bypass for offline testing
      if (apiKey.startsWith('mock_') || process.env.NODE_ENV === 'test') {
        return {
          success: true,
          provider: this.providerType,
          messageId: `${providerName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };
      }

      try {
        let payload: any;
        let contentType = 'application/json';
        const headers: Record<string, string> = {
          [authHeaderName]: prefix ? `${prefix}${apiKey}` : apiKey,
        };

        if (payloadFormatter) {
          payload = payloadFormatter(message, credentials);
        } else {
          // Default JSON payload
          payload = {
            to: Array.isArray(message.to) ? message.to : [message.to],
            from: message.from || 'noreply@localhost',
            subject: message.subject,
            html: message.html,
            text: message.text,
          };
        }

        let bodyData: any;
        if (typeof payload === 'string') {
          bodyData = payload;
        } else if (payload instanceof URLSearchParams) {
          bodyData = payload.toString();
          contentType = 'application/x-www-form-urlencoded';
        } else {
          bodyData = JSON.stringify(payload);
          contentType = 'application/json';
        }

        headers['Content-Type'] = contentType;

        const res = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: bodyData,
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            success: false,
            provider: this.providerType,
            statusCode: res.status,
            error: `${providerName} API error (${res.status}): ${errText}`,
          };
        }

        let parsed: any = {};
        try {
          parsed = await res.json();
        } catch {
          parsed = {};
        }

        const messageId =
          parsed.id ||
          parsed.messageId ||
          parsed.message_id ||
          `${providerName}_${Date.now()}`;

        return {
          success: true,
          provider: this.providerType,
          messageId,
          rawResponse: parsed,
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
