import type { IEmailProvider } from '../core/interfaces/email-provider.interface.js';
import type { ProviderType } from '../core/types/provider.types.js';
import { AwsSesProvider } from './adapters/aws-ses.provider.js';
import { MsGraphProvider } from './adapters/ms-graph.provider.js';
import { GmailProvider } from './adapters/gmail.provider.js';
import {
  ResendProvider,
  PostmarkProvider,
  SendGridProvider,
  BrevoProvider,
  MailgunProvider,
  ScalewayProvider,
  MailerSendProvider,
  ZeptoMailProvider,
  SparkPostProvider,
  MandrillProvider,
  GenericSmtpProvider,
} from './adapters/saas-providers.js';

export class EmailProviderFactory {
  private static providers: Map<string, IEmailProvider> = new Map();

  static {
    EmailProviderFactory.register(new AwsSesProvider());
    EmailProviderFactory.register(new MsGraphProvider());
    EmailProviderFactory.register(new GmailProvider());
    EmailProviderFactory.register(new ResendProvider());
    EmailProviderFactory.register(new PostmarkProvider());
    EmailProviderFactory.register(new SendGridProvider());
    EmailProviderFactory.register(new BrevoProvider());
    EmailProviderFactory.register(new MailgunProvider());
    EmailProviderFactory.register(new ScalewayProvider());
    EmailProviderFactory.register(new MailerSendProvider());
    EmailProviderFactory.register(new ZeptoMailProvider());
    EmailProviderFactory.register(new SparkPostProvider());
    EmailProviderFactory.register(new MandrillProvider());
    EmailProviderFactory.register(new GenericSmtpProvider());
  }

  public static register(provider: IEmailProvider): void {
    EmailProviderFactory.providers.set(provider.providerType, provider);
  }

  public static getProvider(providerType: ProviderType | string): IEmailProvider {
    const provider = EmailProviderFactory.providers.get(providerType);
    if (!provider) {
      throw new Error(`Unsupported email provider type: "${providerType}". Supported: ${Array.from(EmailProviderFactory.providers.keys()).join(', ')}`);
    }
    return provider;
  }

  public static getSupportedProviders(): string[] {
    return Array.from(EmailProviderFactory.providers.keys());
  }
}
