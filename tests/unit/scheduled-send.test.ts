import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { EmailLogRepository } from '../../src/database/repositories/email-log.repository.js';

describe('Unit: Scheduled Email Dispatching', () => {
  const db = createTestDatabase();
  const logRepo = new EmailLogRepository(db);

  it('should not fetch jobs scheduled in the future', () => {
    const futureTime = new Date(Date.now() + 3600_000).toISOString(); // +1 hour

    logRepo.create({
      jobId: 'job_future_01',
      tenantId: 'tenant_sched',
      toRecipients: ['future@example.com'],
      subject: 'Delayed Email',
      priority: 'high',
      scheduledAt: futureTime,
    });

    const job = logRepo.fetchNextJobForProcessing();
    expect(job).toBeNull();
  });

  it('should fetch jobs whose scheduled time is now or in the past', () => {
    const pastTime = new Date(Date.now() - 10_000).toISOString(); // 10s ago

    logRepo.create({
      jobId: 'job_ready_01',
      tenantId: 'tenant_sched',
      toRecipients: ['ready@example.com'],
      subject: 'Ready Email',
      priority: 'normal',
      scheduledAt: pastTime,
    });

    const job = logRepo.fetchNextJobForProcessing();
    expect(job).not.toBeNull();
    expect(job.job_id).toBe('job_ready_01');
  });
});
