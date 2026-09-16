import type { EmailMessage, EmailStatus } from './email.types.js';

export interface EmailContext {
  jobId: string;
  tenantId: string;
  message: EmailMessage;
  accountId?: string;
  providerType?: string;
  status: EmailStatus;
  attempts: number;
  metadata?: Record<string, any>;
}

export interface DispatchResult {
  success: boolean;
  messageId?: string;
  provider: string;
  rawResponse?: any;
  error?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
}

export interface IEmailPlugin {
  name: string;
  onBeforeValidate?(context: EmailContext): Promise<void> | void;
  onBeforeSend?(context: EmailContext): Promise<void> | void;
  onAfterSend?(context: EmailContext, result: DispatchResult): Promise<void> | void;
  onError?(context: EmailContext, error: Error): Promise<void> | void;
}
