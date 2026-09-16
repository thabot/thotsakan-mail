import { describe, expect, it } from 'bun:test';
import { DeadLetterService } from '../../src/services/dead-letter.service.js';

describe('Unit: DeadLetterService', () => {
  const service = new DeadLetterService('https://mock-webhook.example.com/dead-letter');

  it('should build a complete alert payload', () => {
    const job = {
      job_id: 'job_dl_01',
      tenant_id: 'tenant_test',
      to_recipients: JSON.stringify(['victim@example.com']),
      subject: 'Critical OTP Code',
      priority: 'high',
      attempts: 3,
      max_attempts: 3,
      error_details: 'Connection timeout after 3 attempts',
      attempts_history: JSON.stringify([{ attempt: 1, error: '503' }]),
    };

    const payload = service.buildAlertPayload(job);
    expect(payload.jobId).toBe('job_dl_01');
    expect(payload.tenantId).toBe('tenant_test');
    expect(payload.recipients).toEqual(['victim@example.com']);
    expect(payload.subject).toBe('Critical OTP Code');
    expect(payload.priority).toBe('high');
    expect(payload.attempts).toBe(3);
    expect(payload.lastError).toBe('Connection timeout after 3 attempts');
    expect(payload.attemptsHistory?.length).toBe(1);
    expect(payload.failedAt).toBeDefined();
  });

  it('should handle notify when no webhook is configured without crashing', async () => {
    const noWebhookService = new DeadLetterService('');
    const result = await noWebhookService.notify({
      jobId: 'test',
      tenantId: 'test',
      recipients: ['a@b.com'],
      subject: 'test',
      priority: 'normal',
      attempts: 3,
      maxAttempts: 3,
      lastError: 'err',
      failedAt: new Date().toISOString(),
    });

    expect(result).toBe(false);
  });
});
