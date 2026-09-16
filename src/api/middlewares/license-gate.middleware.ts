import type { Context, Next } from 'hono';
import type { FeatureGateService } from '../../services/feature-gate.service.js';
import type { ApiKeyRepository } from '../../database/repositories/api-key.repository.js';

export function createLicenseGateMiddleware(
  featureGate: FeatureGateService,
  apiKeyRepo: ApiKeyRepository
) {
  return async (c: Context, next: Next) => {
    // Check tenant creation quota
    if (c.req.path === '/v1/tenants' && c.req.method === 'POST') {
      const currentTenants = apiKeyRepo.countTenants();
      if (!featureGate.checkTenantLimit(currentTenants)) {
        return c.json(
          {
            error: `Tenant limit exceeded for your license tier (${featureGate.getFlags().maxTenants} max). Upgrade to Pro or Enterprise for higher limits.`,
          },
          403
        );
      }
    }
    await next();
  };
}
