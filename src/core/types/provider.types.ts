export type ProviderType =
  | 'aws-ses'
  | 'ms-graph'
  | 'gmail'
  | 'resend'
  | 'postmark'
  | 'sendgrid'
  | 'brevo'
  | 'mailgun'
  | 'scaleway'
  | 'mailersend'
  | 'zeptomail'
  | 'sparkpost'
  | 'mandrill'
  | 'generic-smtp';

export interface ProviderCredentials {
  apiKey?: string;
  secretKey?: string;
  region?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  serviceAccountJson?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export interface ProviderLimits {
  rateLimitPerMinute: number;
  dailyQuotaLimit: number;
  burstLimit?: number;
}
