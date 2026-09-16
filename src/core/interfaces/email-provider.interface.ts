import type { EmailMessage } from '../types/email.types.js';
import type { ProviderCredentials } from '../types/provider.types.js';
import type { DispatchResult } from '../types/plugin.types.js';

export interface IEmailProvider {
  readonly providerType: string;
  send(message: EmailMessage, credentials: ProviderCredentials): Promise<DispatchResult>;
}

export interface ISentboxCleaner {
  purgeSentItem(messageId: string, credentials: ProviderCredentials): Promise<boolean>;
}
