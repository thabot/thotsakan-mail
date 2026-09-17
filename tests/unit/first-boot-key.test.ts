import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';

describe('Unit: First-Boot Automated Key Provisioning', () => {
  it('should detect 0 keys on fresh database and provision a master API key', () => {
    const db = createTestDatabase();
    const apiKeyRepo = new ApiKeyRepository(db);

    expect(apiKeyRepo.countTotalKeys()).toBe(0);

    // Simulate first-boot key provisioning
    const masterSecret = `thk_live_${crypto.randomUUID().replace(/-/g, '')}`;
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(masterSecret);
    const hash = hasher.digest('hex');

    apiKeyRepo.create('key_master_admin', 'default_tenant', hash, 'First Boot Master Key');

    expect(apiKeyRepo.countTotalKeys()).toBe(1);

    const found = apiKeyRepo.findByHash(hash);
    expect(found).not.toBeNull();
    expect(found.tenant_id).toBe('default_tenant');
    expect(found.id).toBe('key_master_admin');
  });

  it('should not overwrite existing keys if database is already provisioned', () => {
    const db = createTestDatabase();
    const apiKeyRepo = new ApiKeyRepository(db);

    apiKeyRepo.create('key_existing', 'default_tenant', 'hash_existing_123', 'Existing Key');
    expect(apiKeyRepo.countTotalKeys()).toBe(1);

    // Condition check
    const shouldProvision = apiKeyRepo.countTotalKeys() === 0;
    expect(shouldProvision).toBe(false);
  });
});
