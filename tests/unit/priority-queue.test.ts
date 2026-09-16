import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { EmailLogRepository } from '../../src/database/repositories/email-log.repository.js';

describe('Unit: Priority Queue Order', () => {
  const db = createTestDatabase();
  const logRepo = new EmailLogRepository(db);

  it('should fetch high priority (OTP) jobs before normal and low priority', () => {
    // 1. Enqueue Normal priority job first
    logRepo.create({
      jobId: 'job_normal_1',
      tenantId: 'tenant_q',
      toRecipients: ['normal@example.com'],
      subject: 'Weekly Newsletter',
      priority: 'normal',
    });

    // 2. Enqueue Low priority job
    logRepo.create({
      jobId: 'job_low_1',
      tenantId: 'tenant_q',
      toRecipients: ['low@example.com'],
      subject: 'Marketing Blast',
      priority: 'low',
    });

    // 3. Enqueue High priority job last
    logRepo.create({
      jobId: 'job_high_1',
      tenantId: 'tenant_q',
      toRecipients: ['otp@example.com'],
      subject: 'Your 2FA Login OTP Code',
      priority: 'high',
    });

    // Dequeue 1st job -> MUST BE job_high_1
    const job1 = logRepo.fetchNextJobForProcessing();
    expect(job1).not.toBeNull();
    expect(job1.job_id).toBe('job_high_1');
    expect(job1.priority).toBe('high');
    expect(job1.status).toBe('PROCESSING');

    // Dequeue 2nd job -> MUST BE job_normal_1
    const job2 = logRepo.fetchNextJobForProcessing();
    expect(job2).not.toBeNull();
    expect(job2.job_id).toBe('job_normal_1');
    expect(job2.priority).toBe('normal');

    // Dequeue 3rd job -> MUST BE job_low_1
    const job3 = logRepo.fetchNextJobForProcessing();
    expect(job3).not.toBeNull();
    expect(job3.job_id).toBe('job_low_1');
    expect(job3.priority).toBe('low');

    // No more jobs
    const job4 = logRepo.fetchNextJobForProcessing();
    expect(job4).toBeNull();
  });
});
