import type { AccountRepository } from '../database/repositories/account.repository.js';
import type { CryptoService } from './crypto.service.js';
import type { ProviderCredentials } from '../core/types/provider.types.js';

export interface TokenResponse {
  accessToken: string;
  expiresInSeconds: number;
}

export type TokenFetcher = (credentials: ProviderCredentials) => Promise<TokenResponse>;

export class TokenManagerService {
  private customFetchers: Map<string, TokenFetcher> = new Map();

  constructor(
    private accountRepo: AccountRepository,
    private cryptoService: CryptoService
  ) {}

  public registerCustomFetcher(providerType: string, fetcher: TokenFetcher): void {
    this.customFetchers.set(providerType, fetcher);
  }

  public async getOrRefreshToken(accountId: string): Promise<string> {
    const account = this.accountRepo.findById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Check if valid token cached
    if (account.token_cache && account.token_expires_at) {
      const expiresAt = new Date(account.token_expires_at).getTime();
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;

      // If token has more than 5 minutes remaining, use it
      if (expiresAt - now > fiveMinutesMs) {
        try {
          return this.cryptoService.decrypt(account.token_cache);
        } catch (err) {
          console.warn(`Failed to decrypt cached token for ${accountId}, refreshing...`);
        }
      }
    }

    // Refresh token
    const decryptedCreds: ProviderCredentials = JSON.parse(
      this.cryptoService.decrypt(account.credentials)
    );

    const tokenResponse = await this.fetchNewToken(account.provider_type, decryptedCreds);

    // Calculate expiry (subtract 60s for clock skew safety)
    const expiryDate = new Date(Date.now() + (tokenResponse.expiresInSeconds - 60) * 1000).toISOString();
    const encryptedToken = this.cryptoService.encrypt(tokenResponse.accessToken);

    this.accountRepo.updateTokenCache(accountId, encryptedToken, expiryDate);

    return tokenResponse.accessToken;
  }

  private async fetchNewToken(
    providerType: string,
    credentials: ProviderCredentials
  ): Promise<TokenResponse> {
    const customFetcher = this.customFetchers.get(providerType);
    if (customFetcher) {
      return await customFetcher(credentials);
    }

    switch (providerType) {
      case 'ms-graph':
        return await this.fetchMicrosoftGraphToken(credentials);
      case 'gmail':
        return await this.fetchGoogleWorkspaceToken(credentials);
      default:
        throw new Error(`Autonomous token refresh is not supported or not required for provider: ${providerType}`);
    }
  }

  private async fetchMicrosoftGraphToken(credentials: ProviderCredentials): Promise<TokenResponse> {
    const { tenantId, clientId, clientSecret } = credentials;
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Missing MS Graph credentials (tenantId, clientId, clientSecret)');
    }

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`MS Graph token request failed (${res.status}): ${errorText}`);
    }

    const data: any = await res.json();
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }

  private async fetchGoogleWorkspaceToken(credentials: ProviderCredentials): Promise<TokenResponse> {
    const { clientId, clientSecret, refreshToken } = credentials;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Google Workspace OAuth2 credentials (clientId, clientSecret, refreshToken)');
    }

    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google token refresh failed (${res.status}): ${errorText}`);
    }

    const data: any = await res.json();
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}
