import type { Context, Next } from 'hono';
import { createHash } from 'node:crypto';
import type { ApiKeyRepository } from '../../database/repositories/api-key.repository.js';

export function createAuthMiddleware(apiKeyRepo: ApiKeyRepository) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key');
    if (!apiKey) {
      return c.json({ error: 'Unauthorized: Missing X-API-Key header' }, 401);
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const tenantKey = apiKeyRepo.findByHash(keyHash);

    if (!tenantKey) {
      return c.json({ error: 'Unauthorized: Invalid or revoked API key' }, 401);
    }

    c.set('tenantId', tenantKey.tenant_id);
    c.set('apiKeyId', tenantKey.id);
    await next();
  };
}
