import type { Context, Next } from 'hono';
import type { IdempotencyRepository } from '../../database/repositories/idempotency.repository.js';

export function createIdempotencyMiddleware(idempotencyRepo: IdempotencyRepository) {
  return async (c: Context, next: Next) => {
    const idempotencyKey = c.req.header('Idempotency-Key');
    if (!idempotencyKey) {
      return await next();
    }

    const tenantId = c.get('tenantId') || 'anonymous';
    const cached = idempotencyRepo.get(idempotencyKey, tenantId);

    if (cached) {
      c.header('X-Idempotent-Replay', 'true');
      return c.newResponse(cached.body, cached.status as any, {
        'Content-Type': 'application/json',
      });
    }

    await next();

    // Cache successful or accepted responses
    const status = c.res.status;
    if (status >= 200 && status < 300) {
      const clonedResponse = c.res.clone();
      const body = await clonedResponse.text();
      idempotencyRepo.save(idempotencyKey, tenantId, status, body, 24);
    }
  };
}
