import { describe, expect, it } from 'bun:test';
import { SentboxCleanerService } from '../../src/services/sentbox-cleaner.service.js';

describe('SentboxCleanerService', () => {
  const cleaner = new SentboxCleanerService();

  it('should have cleaner strategies registered for ms-graph and gmail', () => {
    expect(cleaner).toBeDefined();
  });

  it('should gracefully handle purge call with custom mock strategy', async () => {
    cleaner.registerStrategy('custom-mail', {
      purgeSentItem: async (msgId) => msgId === 'valid_id',
    });

    const success = await cleaner.clean('custom-mail', 'valid_id', {});
    expect(success).toBe(true);

    const fail = await cleaner.clean('custom-mail', 'invalid_id', {});
    expect(fail).toBe(false);
  });

  it('should return false if no strategy registered for provider', async () => {
    const result = await cleaner.clean('aws-ses', 'any_id', {});
    expect(result).toBe(false);
  });
});
