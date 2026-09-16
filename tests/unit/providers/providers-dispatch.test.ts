import { describe, expect, it } from 'bun:test';
import { EmailProviderFactory } from '../../../src/providers/factory.js';
import type { EmailMessage } from '../../../src/core/types/email.types.js';

describe('Unit Tests: 14 Provider Adapters Dispatch Execution', () => {
  const sampleMessage: EmailMessage = {
    to: 'recipient@example.com',
    subject: 'Test Email Dispatch',
    html: '<p>Hello from Thotsakan</p>',
  };

  const providers = EmailProviderFactory.getSupportedProviders();

  for (const providerType of providers) {
    it(`should successfully dispatch with valid credentials via ${providerType}`, async () => {
      const adapter = EmailProviderFactory.getProvider(providerType);
      
      const creds: any = providerType === 'generic-smtp' 
        ? { host: 'smtp.mail.com', port: 587, user: 'test', pass: 'secret' }
        : { apiKey: 'mock_api_key_123', secretKey: 'mock_secret_456', region: 'us-east-1' };

      const result = await adapter.send(sampleMessage, creds);

      expect(result.success).toBe(true);
      expect(result.provider).toBe(providerType);
      expect(result.messageId).toBeDefined();
    });

    it(`should return error response when credentials are missing via ${providerType}`, async () => {
      const adapter = EmailProviderFactory.getProvider(providerType);
      const result = await adapter.send(sampleMessage, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  }
});
