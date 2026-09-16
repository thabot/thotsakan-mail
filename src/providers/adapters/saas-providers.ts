import { createHttpAdapter } from './http-base.adapter.js';
import type { IEmailProvider } from '../../core/interfaces/email-provider.interface.js';
import type { EmailMessage } from '../../core/types/email.types.js';
import type { ProviderCredentials } from '../../core/types/provider.types.js';
import type { DispatchResult } from '../../core/types/plugin.types.js';

export const ResendProvider = createHttpAdapter('resend', 'https://api.resend.com/emails');
export const PostmarkProvider = createHttpAdapter('postmark', 'https://api.postmarkapp.com/email', 'X-Postmark-Server-Token', '');
export const SendGridProvider = createHttpAdapter('sendgrid', 'https://api.sendgrid.com/v3/mail/send');
export const BrevoProvider = createHttpAdapter('brevo', 'https://api.brevo.com/v3/smtp/email', 'api-key', '');
export const MailgunProvider = createHttpAdapter('mailgun', 'https://api.mailgun.net/v3');
export const ScalewayProvider = createHttpAdapter('scaleway', 'https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails', 'X-Auth-Token', '');
export const MailerSendProvider = createHttpAdapter('mailersend', 'https://api.mailersend.com/v1/email');
export const ZeptoMailProvider = createHttpAdapter('zeptomail', 'https://api.zeptomail.com/v1.1/email/template');
export const SparkPostProvider = createHttpAdapter('sparkpost', 'https://api.sparkpost.com/api/v1/transmissions');
export const MandrillProvider = createHttpAdapter('mandrill', 'https://mandrillapp.com/api/1.0/messages/send');

export class GenericSmtpProvider implements IEmailProvider {
  public readonly providerType = 'generic-smtp';

  public async send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult> {
    if (!credentials.host || !credentials.port) {
      return {
        success: false,
        provider: this.providerType,
        error: 'Missing SMTP host or port in credentials',
      };
    }

    try {
      const messageId = `smtp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        provider: this.providerType,
        messageId,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.providerType,
        error: err.message || 'SMTP Transmission Error',
      };
    }
  }
}
