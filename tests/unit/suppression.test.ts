import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { SuppressionService } from '../../src/services/suppression.service.js';

describe('Unit: Suppression List Service', () => {
  const db = createTestDatabase();
  const service = new SuppressionService(db);

  it('should suppress and identify blocked email addresses', () => {
    service.suppress('bounced@badhost.com', 'tenant_1', 'BOUNCE');

    const check1 = service.checkSuppression(['clean@goodhost.com'], 'tenant_1');
    expect(check1.isSuppressed).toBe(false);

    const check2 = service.checkSuppression(['bounced@badhost.com'], 'tenant_1');
    expect(check2.isSuppressed).toBe(true);
    expect(check2.suppressedEmail).toBe('bounced@badhost.com');
  });

  it('should be tenant-scoped', () => {
    // bounced@badhost.com was suppressed for tenant_1, not tenant_2
    const check = service.checkSuppression(['bounced@badhost.com'], 'tenant_2');
    expect(check.isSuppressed).toBe(false);
  });

  it('should allow unsuppression', () => {
    service.unsuppress('bounced@badhost.com', 'tenant_1');
    const check = service.checkSuppression(['bounced@badhost.com'], 'tenant_1');
    expect(check.isSuppressed).toBe(false);
  });
});
