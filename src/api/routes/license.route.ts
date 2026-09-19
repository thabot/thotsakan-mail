import { Hono } from 'hono';
import type { LicenseManagerService } from '../../services/license-manager.service.js';
import type { FeatureGateService } from '../../services/feature-gate.service.js';

export function createLicenseRoute(
  licenseManager: LicenseManagerService,
  featureGate: FeatureGateService
) {
  const app = new Hono();

  app.get('/v1/license/status', async (c) => {
    const machine = await licenseManager.getMachineStatus();
    const claims = licenseManager.getClaims();

    return c.json({
      tier: licenseManager.getTier(),
      status: licenseManager.getStatus(),
      claims: claims,
      features: featureGate.getFlags(),
      machine: {
        machine_id: machine.currentMachineId,
        is_bound: machine.isMachineBound,
        is_valid: machine.machineMatch,
        instance_limit: claims?.instance_limit ?? 1,
        is_break_glass_active: machine.isBreakGlassActive,
        break_glass_hours_remaining: machine.breakGlassHoursRemaining,
        clock_tampered: machine.clockTampered,
      },
    });
  });

  app.post('/v1/license/activate', async (c) => {
    try {
      const body = await c.req.json();
      const licenseKey = body?.license_key;
      if (!licenseKey || typeof licenseKey !== 'string') {
        return c.json({ success: false, error: 'license_key is required' }, 400);
      }

      const result = await licenseManager.verifyLicense(licenseKey);
      return c.json({
        success: result.status === 'VALID',
        result,
      });
    } catch (err: any) {
      return c.json({ success: false, error: err?.message || 'Invalid request' }, 400);
    }
  });


  return app;
}
