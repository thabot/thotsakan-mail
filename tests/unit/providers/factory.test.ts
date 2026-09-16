import { describe, expect, it } from 'bun:test';
import { EmailProviderFactory } from '../../../src/providers/factory.js';

describe('EmailProviderFactory (14 Providers Resolution)', () => {
  const all14Providers = [
    'aws-ses',
    'ms-graph',
    'gmail',
    'resend',
    'postmark',
    'sendgrid',
    'brevo',
    'mailgun',
    'scaleway',
    'mailersend',
    'zeptomail',
    'sparkpost',
    'mandrill',
    'generic-smtp'
  ];

  it('should support exactly all 14 enterprise & cloud email providers', () => {
    const supported = EmailProviderFactory.getSupportedProviders();
    expect(supported.length).toBe(14);
    for (const p of all14Providers) {
      expect(supported).toContain(p);
    }
  });

  it('should return valid adapter instance for each supported provider', () => {
    for (const p of all14Providers) {
      const adapter = EmailProviderFactory.getProvider(p);
      expect(adapter).toBeDefined();
      expect(adapter.providerType).toBe(p);
      expect(typeof adapter.send).toBe('function');
    }
  });

  it('should throw clear error on unknown provider type', () => {
    expect(() => EmailProviderFactory.getProvider('unknown-provider')).toThrow('Unsupported email provider type');
  });
});
