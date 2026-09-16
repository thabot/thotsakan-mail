import { describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { createTestDatabase } from '../helpers/test-db.js';
import { SmtpRelayHandler } from '../../src/smtp/smtp-relay.js';
import { ApiKeyRepository } from '../../src/database/repositories/api-key.repository.js';
import { EmailLogRepository } from '../../src/database/repositories/email-log.repository.js';

describe('Unit: Inbound SMTP Relay Handler', () => {
  const db = createTestDatabase();
  const apiKeyRepo = new ApiKeyRepository(db);
  const logRepo = new EmailLogRepository(db);
  const relayHandler = new SmtpRelayHandler(db);

  // Setup API Key
  const secretKey = 'thotsakan_smtp_secret_key';
  const keyHash = createHash('sha256').update(secretKey).digest('hex');
  apiKeyRepo.create('key_smtp_01', 'tenant_smtp', keyHash, 'SMTP Relay Key');

  it('should authenticate client with valid API key credentials', () => {
    const valid = relayHandler.authenticate('api', secretKey);
    expect(valid.authenticated).toBe(true);
    expect(valid.tenantId).toBe('tenant_smtp');

    const invalid = relayHandler.authenticate('api', 'wrong_password');
    expect(invalid.authenticated).toBe(false);
  });

  it('should parse raw RFC822 MIME message into structured fields', () => {
    const rawMime = [
      'From: Legacy App <noreply@legacy.local>',
      'To: customer1@example.com, customer2@example.com',
      'Subject: Order #1234 Invoice',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<html><body><h1>Thank you for your order!</h1></body></html>',
    ].join('\r\n');

    const parsed = SmtpRelayHandler.parseRawEmail(rawMime);
    expect(parsed.from).toBe('noreply@legacy.local');
    expect(parsed.to).toEqual(['customer1@example.com', 'customer2@example.com']);
    expect(parsed.subject).toBe('Order #1234 Invoice');
    expect(parsed.body).toContain('<h1>Thank you for your order!</h1>');
    expect(parsed.html).toBeDefined();
  });

  it('should ingest parsed email directly into priority queue', () => {
    const parsed = {
      from: 'wordpress@mysite.com',
      to: ['buyer@shop.com'],
      subject: 'Your Account Was Created',
      body: 'Welcome to our platform',
    };

    const res = relayHandler.ingest(parsed, 'tenant_smtp');
    expect(res.ok).toBe(true);
    expect(res.jobId).toBeDefined();

    const job = logRepo.findById(res.jobId!);
    expect(job).not.toBeNull();
    expect(job.status).toBe('PENDING');
    expect(job.priority).toBe('normal');
  });
});
