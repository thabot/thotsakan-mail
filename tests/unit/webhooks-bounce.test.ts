import { describe, expect, it } from 'bun:test';
import { createTestDatabase } from '../helpers/test-db.js';
import { EmailLogRepository } from '../../src/database/repositories/email-log.repository.js';
import { createWebhooksRoute } from '../../src/api/routes/webhooks.route.js';

describe('Unit: Webhooks & EmailLogRepository Bounce Handling', () => {
  const db = createTestDatabase();
  const logRepo = new EmailLogRepository(db);
  const app = createWebhooksRoute(db);

  it('EmailLogRepository.markBounced should update status to BOUNCED by messageId', () => {
    logRepo.create({
      jobId: 'job_b1',
      tenantId: 'tenant_t1',
      toRecipients: ['user1@test.com'],
      subject: 'Hello',
      priority: 'normal',
      isSync: false,
    });
    logRepo.markSent('job_b1', 'aws-ses', 'msg_ses_12345');

    const updated = logRepo.markBounced({ messageId: 'msg_ses_12345' }, 'Mailbox does not exist');
    expect(updated).toBe(1);

    const log = logRepo.findById('job_b1');
    expect(log.status).toBe('BOUNCED');
    expect(log.error_details).toBe('Mailbox does not exist');
  });

  it('EmailLogRepository.markBounced should fallback to matching recipient email when messageId not found', () => {
    logRepo.create({
      jobId: 'job_b2',
      tenantId: 'tenant_t1',
      toRecipients: ['user2@test.com'],
      subject: 'Hello 2',
      priority: 'normal',
      isSync: false,
    });
    logRepo.markSent('job_b2', 'resend', 'msg_resend_999');

    const updated = logRepo.markBounced({ email: 'user2@test.com' }, 'Mailbox quota exceeded');
    expect(updated).toBe(1);

    const log = logRepo.findById('job_b2');
    expect(log.status).toBe('BOUNCED');
    expect(log.error_details).toBe('Mailbox quota exceeded');
  });

  it('EmailLogRepository.getOverviewMetrics should count BOUNCED jobs correctly', () => {
    const metrics = logRepo.getOverviewMetrics('tenant_t1');
    expect(metrics.bounced).toBe(2);
  });

  it('Resend Webhook should parse bounce event and update email_logs', async () => {
    logRepo.create({
      jobId: 'job_resend_test',
      tenantId: 'tenant_t1',
      toRecipients: ['resend_bounced@target.com'],
      subject: 'Receipt',
      priority: 'normal',
      isSync: false,
    });
    logRepo.markSent('job_resend_test', 'resend', 'resend_msg_001');

    const payload = {
      type: 'email.bounced',
      data: {
        id: 'resend_msg_001',
        to: ['resend_bounced@target.com'],
        bounce_type: 'Permanent',
        bounce_message: 'Recipient address rejected: 550 5.1.1',
      },
    };

    const res = await app.request('/v1/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);

    const log = logRepo.findById('job_resend_test');
    expect(log.status).toBe('BOUNCED');
    expect(log.error_details).toContain('Recipient address rejected');
  });

  it('SendGrid Webhook should parse bounce event and update email_logs', async () => {
    logRepo.create({
      jobId: 'job_sendgrid_test',
      tenantId: 'tenant_t1',
      toRecipients: ['sg_bounced@target.com'],
      subject: 'Newsletter',
      priority: 'normal',
      isSync: false,
    });
    logRepo.markSent('job_sendgrid_test', 'sendgrid', 'sg_msg_987');

    const events = [
      {
        event: 'bounce',
        email: 'sg_bounced@target.com',
        sg_message_id: 'sg_msg_987',
        reason: '552 5.2.2 Mailbox is full',
        status: '5.2.2',
      },
    ];

    const res = await app.request('/v1/webhooks/sendgrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    });
    expect(res.status).toBe(200);

    const log = logRepo.findById('job_sendgrid_test');
    expect(log.status).toBe('BOUNCED');
    expect(log.error_details).toContain('Mailbox is full');
  });
});
