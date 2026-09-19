import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { LicenseManagerService } from '../../src/services/license-manager.service.js';
import { FeatureGateService } from '../../src/services/feature-gate.service.js';
import { createLicenseRoute } from '../../src/api/routes/license.route.js';

describe('Integration: License Route (/v1/license/status)', () => {
  const licenseManager = new LicenseManagerService();
  const featureGate = new FeatureGateService(licenseManager);

  const app = new Hono();
  app.route('/', createLicenseRoute(licenseManager, featureGate));

  it('should return current license status with machine information and active feature flags', async () => {
    const res = await app.request('/v1/license/status');
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.tier).toBe('COMMUNITY');
    expect(json.status).toBe('VALID');
    expect(json.machine).toBeDefined();
    expect(json.machine.machine_id).toBeDefined();
    expect(json.machine.machine_id.startsWith('thk_mach_')).toBe(true);
    expect(json.features.canAccessWebUI).toBe(false);
    expect(json.features.maxTenants).toBe(3);
  });

  it('should reject activation when license_key is missing or invalid', async () => {
    const res = await app.request('/v1/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
  });

});
