import { getEnv } from '../config/env.js';

export interface DeadLetterPayload {
  jobId: string;
  tenantId: string;
  recipients: string[];
  subject: string;
  priority: string;
  attempts: number;
  maxAttempts: number;
  lastError: string;
  attemptsHistory?: any[];
  failedAt: string;
}

export class DeadLetterService {
  private webhookUrl?: string;

  constructor(customWebhookUrl?: string) {
    this.webhookUrl = customWebhookUrl || getEnv().DEAD_LETTER_WEBHOOK_URL;
  }

  public buildAlertPayload(job: {
    job_id: string;
    tenant_id: string;
    to_recipients: string | string[];
    subject: string;
    priority?: string;
    attempts: number;
    max_attempts?: number;
    error_details?: string;
    attempts_history?: string | any[];
  }): DeadLetterPayload {
    const recipients =
      typeof job.to_recipients === 'string' ? JSON.parse(job.to_recipients) : job.to_recipients;

    const attemptsHistory =
      typeof job.attempts_history === 'string'
        ? JSON.parse(job.attempts_history || '[]')
        : job.attempts_history;

    return {
      jobId: job.job_id,
      tenantId: job.tenant_id,
      recipients,
      subject: job.subject,
      priority: job.priority || 'normal',
      attempts: job.attempts,
      maxAttempts: job.max_attempts || 3,
      lastError: job.error_details || 'Unknown dispatch failure',
      attemptsHistory,
      failedAt: new Date().toISOString(),
    };
  }

  public async notify(payload: DeadLetterPayload): Promise<boolean> {
    const targetUrl = this.webhookUrl;
    if (!targetUrl) {
      console.warn(`[DeadLetterService] No webhook URL configured. Job ${payload.jobId} failed permanently.`);
      return false;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Thotsakan-Mail-DeadLetter/1.0',
        },
        body: JSON.stringify({
          text: `🚨 [Thotsakan Dead-Letter Alert] Job ${payload.jobId} FAILED after ${payload.attempts} attempts.\nTo: ${payload.recipients.join(', ')}\nSubject: ${payload.subject}\nError: ${payload.lastError}`,
          details: payload,
        }),
      });

      return response.ok;
    } catch (err: any) {
      console.error(`[DeadLetterService] Failed to deliver dead-letter webhook to ${targetUrl}:`, err.message);
      return false;
    }
  }
}
