import { Hono } from 'hono';
import type { LicenseManagerService } from '../../services/license-manager.service.js';
import type { FeatureGateService } from '../../services/feature-gate.service.js';

export function createLicenseRoute(
  licenseManager: LicenseManagerService,
  featureGate: FeatureGateService
) {
  const app = new Hono();

  app.get('/v1/license/status', (c) => {
    return c.json({
      tier: licenseManager.getTier(),
      claims: licenseManager.getClaims(),
      features: featureGate.getFlags(),
    });
  });

  return app;
}
