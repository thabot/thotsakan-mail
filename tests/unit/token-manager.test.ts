import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { AccountRepository } from '../../src/database/repositories/account.repository.js';
import { CryptoService } from '../../src/services/crypto.service.js';
import { TokenManagerService } from '../../src/services/token-manager.service.js';

describe('TokenManagerService (Autonomous Token Refresh)', () => {
  const db = createTestDatabase();
  const accountRepo = new AccountRepository(db);
  const cryptoService = new CryptoService('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  const tokenManager = new TokenManagerService(accountRepo, cryptoService);

  // Register mock token fetcher
  let fetchCount = 0;
  tokenManager.registerCustomFetcher('ms-graph', async () => {
    fetchCount++;
    return {
      accessToken: `mock_msal_token_${fetchCount}`,
      expiresInSeconds: 3600,
    };
  });

  it('should fetch new token and cache it encrypted when no token exists', async () => {
    accountRepo.create({
      id: 'm365_acc',
      tenantId: 'tenant_test',
      name: 'M365 Corporate',
      providerType: 'ms-graph',
      encryptedCredentials: cryptoService.encrypt(JSON.stringify({ tenantId: 't1', clientId: 'c1', clientSecret: 's1' })),
      fromEmail: 'admin@company.com',
    });

    const token1 = await tokenManager.getOrRefreshToken('m365_acc');
    expect(token1).toBe('mock_msal_token_1');
    expect(fetchCount).toBe(1);

    // Second call should return cached token without requesting upstream
    const token2 = await tokenManager.getOrRefreshToken('m365_acc');
    expect(token2).toBe('mock_msal_token_1');
    expect(fetchCount).toBe(1);
  });

  it('should refresh token automatically when cached token is near expiration (< 5 mins)', async () => {
    // Force token to be expiring in 2 minutes
    const expiringSoon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    accountRepo.updateTokenCache('m365_acc', cryptoService.encrypt('old_token'), expiringSoon);

    const refreshedToken = await tokenManager.getOrRefreshToken('m365_acc');
    expect(refreshedToken).toBe('mock_msal_token_2');
    expect(fetchCount).toBe(2);
  });
});
