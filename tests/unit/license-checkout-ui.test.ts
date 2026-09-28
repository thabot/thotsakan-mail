import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { renderWebUI } from '../../src/ui/console.html.js';
import { LicenseManagerService } from '../../src/services/license-manager.service.js';
import { FeatureGateService } from '../../src/services/feature-gate.service.js';
import { createLicenseRoute } from '../../src/api/routes/license.route.js';
import { generateTestKeys, createSignedTestLicense } from '../helpers/license-test-keys.js';

describe('Unit: License Sphere Pay Checkout UI & Activation Flow', async () => {
  const { publicSpki, privateKey } = await generateTestKeys();

  it('should render Sphere Pay checkout button and modal with Card & Crypto payment badges in Web Console', () => {
    const html = renderWebUI();
    
    // Verify Purchase Button
    expect(html).toContain('Buy / Upgrade License (Card & Crypto)');
    expect(html).toContain('openLicenseCheckoutModal()');

    // Verify Modal & Pricing Tiers
    expect(html).toContain('modal-license-checkout');
    expect(html).toContain('PRO Tier');
    expect(html).toContain('$49');
    expect(html).toContain('ENTERPRISE');
    expect(html).toContain('$199');

    // Verify Multi-Channel Payment Badges
    expect(html).toContain('Visa / Mastercard');
    expect(html).toContain('Apple Pay');
    expect(html).toContain('Solana / USDC / USDT / ETH');

    // Verify Machine ID binding input
    expect(html).toContain('checkout-machine-id');
    expect(html).toContain('Bound to Current Node');

    // Verify Script Functions
    expect(html).toContain('initiateSphereCheckout');
    expect(html).toContain('startSpherePaymentPolling');
  });

  it('should seamlessly auto-activate PRO license token generated after Sphere Pay checkout', async () => {
    const licenseManager = new LicenseManagerService(publicSpki);
    const featureGate = new FeatureGateService(licenseManager);

    const app = new Hono();
    app.route('/', createLicenseRoute(licenseManager, featureGate));

    // Initially Community
    const initialStatus = await app.request('/v1/license/status');
    const initialJson: any = await initialStatus.json();
    expect(initialJson.tier).toBe('COMMUNITY');
    expect(featureGate.canAccessWebUI()).toBe(false);

    // Simulate Sphere Pay Webhook generated signed token for PRO tier
    const proToken = await createSignedTestLicense(privateKey, {
      tier: 'PRO',
      sub: 'cust_sphere_buyer_01',
      features: ['web_ui', 'visual_template_editor', 'smart_failover'],
      instance_limit: 1,
    });

    // Auto-activate on node
    const activateRes = await app.request('/v1/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: proToken }),
    });

    expect(activateRes.status).toBe(200);
    const activateJson: any = await activateRes.json();
    expect(activateJson.success).toBe(true);
    expect(activateJson.result.tier).toBe('PRO');

    // Verify node is now PRO with unlocked features
    const updatedStatus = await app.request('/v1/license/status');
    const updatedJson: any = await updatedStatus.json();
    expect(updatedJson.tier).toBe('PRO');
    expect(updatedJson.status).toBe('VALID');
    expect(featureGate.canAccessWebUI()).toBe(true);
    expect(featureGate.getFlags().canUseVisualTemplateEditor).toBe(true);
    expect(featureGate.getFlags().canUseBatchApi).toBe(true);
  });
});
