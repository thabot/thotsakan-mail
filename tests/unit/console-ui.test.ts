import { describe, expect, it } from 'bun:test';
import { renderWebUI } from '../../src/ui/console.html.js';

describe('Unit: Web Console Provider Guides Tab & 14 Email Providers UI', () => {
  it('should render the Provider Guides navigation tab button and section container', () => {
    const html = renderWebUI();

    // Verify Main Tab Button
    expect(html).toContain('tab-btn-guides');
    expect(html).toContain("switchTab('guides')");
    expect(html).toContain('Provider Guides');

    // Verify Main Section
    expect(html).toContain('id="view-guides"');
    expect(html).toContain('คู่มือการเชื่อมต่อผู้ให้บริการแต่ละเจ้า (Provider Setup Guides)');
  });

  it('should render sub-tab buttons and guide panes for all 14 supported email providers', () => {
    const html = renderWebUI();

    const expectedProviders = [
      'ms-graph',
      'gmail',
      'aws-ses',
      'resend',
      'sendgrid',
      'postmark',
      'brevo',
      'mailgun',
      'mailersend',
      'zeptomail',
      'scaleway',
      'sparkpost',
      'mandrill',
      'generic-smtp',
    ];

    expectedProviders.forEach((provider) => {
      // Sub-tab button
      expect(html).toContain(`id="guide-tab-btn-${provider}"`);
      expect(html).toContain(`switchProviderGuideTab('${provider}')`);

      // Guide content pane
      expect(html).toContain(`id="guide-pane-${provider}"`);

      // JSON payload snippet container & copy button
      expect(html).toContain(`id="code-payload-${provider}"`);
      expect(html).toContain(`copyProviderPayload('code-payload-${provider}')`);

      // Quick connect button
      expect(html).toContain(`quickConnectProvider('${provider}')`);
    });
  });

  it('should provide direct quick links in Add Account modal and Onboarding wizard', () => {
    const html = renderWebUI();

    // In Add Account Modal
    expect(html).toContain('openCurrentProviderGuide()');
    expect(html).toContain('ดูคู่มือของเจ้านี้');

    // In Outbound Accounts Table Header
    expect(html).toContain("onclick=\"switchTab('guides')\"");

    // In JavaScript functions
    expect(html).toContain('function switchProviderGuideTab(p)');
    expect(html).toContain('function quickConnectProvider(p)');
    expect(html).toContain('function openCurrentProviderGuide()');
    expect(html).toContain('function copyProviderPayload(elementId)');
  });
});
