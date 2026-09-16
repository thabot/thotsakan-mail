import type { ProviderCredentials } from '../core/types/provider.types.js';

export interface ISentboxCleanerStrategy {
  purgeSentItem(messageId: string, credentials: ProviderCredentials): Promise<boolean>;
}

export class MsGraphSentboxCleaner implements ISentboxCleanerStrategy {
  public async purgeSentItem(messageId: string, credentials: ProviderCredentials): Promise<boolean> {
    const accessToken = credentials.apiKey; // bearer token injected
    if (!accessToken) {
      throw new Error('Access token required for MS Graph Sentbox cleaner');
    }

    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.ok || res.status === 404;
  }
}

export class GmailSentboxCleaner implements ISentboxCleanerStrategy {
  public async purgeSentItem(messageId: string, credentials: ProviderCredentials): Promise<boolean> {
    const accessToken = credentials.apiKey;
    if (!accessToken) {
      throw new Error('Access token required for Gmail Sentbox cleaner');
    }

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.ok || res.status === 404;
  }
}

export class SentboxCleanerService {
  private strategies: Map<string, ISentboxCleanerStrategy> = new Map();

  constructor() {
    this.strategies.set('ms-graph', new MsGraphSentboxCleaner());
    this.strategies.set('gmail', new GmailSentboxCleaner());
  }

  public registerStrategy(providerType: string, strategy: ISentboxCleanerStrategy): void {
    this.strategies.set(providerType, strategy);
  }

  public async clean(providerType: string, messageId: string, credentials: ProviderCredentials): Promise<boolean> {
    const strategy = this.strategies.get(providerType);
    if (!strategy) {
      console.warn(`No Sentbox cleaner strategy registered for provider: ${providerType}`);
      return false;
    }
    try {
      return await strategy.purgeSentItem(messageId, credentials);
    } catch (err) {
      console.error(`Error purging sent item for ${providerType} (${messageId}):`, err);
      return false;
    }
  }
}
