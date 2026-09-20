import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { AccountRepository } from '../../src/database/repositories/account.repository.js';
import { CryptoService } from '../../src/services/crypto.service.js';
import { Hono } from 'hono';
import { createEmailsRoute } from '../../src/api/routes/emails.route.js';

describe('Unit: Client Secret Expiry Alert System', () => {
  const db = createTestDatabase();
  const accountRepo = new AccountRepository(db);
  const cryptoService = new CryptoService('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

  const app = new Hono();
  app.route('/', createEmailsRoute(db));

  it('should store secret_expires_at correctly in database', () => {
    const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days
    accountRepo.create({
      id: 'acc_expiry_test_1',
      tenantId: 'default_tenant',
      name: 'M365 Safe Account',
      providerType: 'ms-graph',
      encryptedCredentials: cryptoService.encrypt(JSON.stringify({ tenantId: 't', clientId: 'c', clientSecret: 's' })),
      fromEmail: 'safe@company.com',
      secretExpiresAt: futureDate,
    });

    const stored = accountRepo.findById('acc_expiry_test_1');
    expect(stored).not.toBeNull();
    expect(stored.secret_expires_at).toBe(futureDate);
  });

  it('should calculate warning for secrets expiring within 30 days via GET /v1/accounts', async () => {
    // 15 days in the future
    const expiringSoon = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    accountRepo.create({
      id: 'acc_expiry_test_2',
      tenantId: 'default_tenant',
      name: 'M365 Expiring Soon',
      providerType: 'ms-graph',
      encryptedCredentials: cryptoService.encrypt(JSON.stringify({ tenantId: 't', clientId: 'c', clientSecret: 's' })),
      fromEmail: 'expiring@company.com',
      secretExpiresAt: expiringSoon,
    });

    const res = await app.request('/v1/accounts', {
      method: 'GET',
      headers: { 'X-API-Key': 'mock' },
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    const expiringAcc = data.accounts.find((a: any) => a.id === 'acc_expiry_test_2');

    expect(expiringAcc).toBeDefined();
    expect(expiringAcc.warning).not.toBeNull();
    expect(expiringAcc.warning.code).toBe('SECRET_EXPIRING_SOON');
    expect(expiringAcc.warning.remainingDays).toBeLessThanOrEqual(15);
    expect(expiringAcc.warning.remainingDays).toBeGreaterThanOrEqual(14);
  });

  it('should not set warning for accounts with expiry > 30 days', async () => {
    const res = await app.request('/v1/accounts', {
      method: 'GET',
      headers: { 'X-API-Key': 'mock' },
    });

    const data: any = await res.json();
    const safeAcc = data.accounts.find((a: any) => a.id === 'acc_expiry_test_1');

    expect(safeAcc).toBeDefined();
    expect(safeAcc.warning).toBeNull();
  });
});
