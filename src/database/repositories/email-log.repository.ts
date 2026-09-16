import type { Database } from 'bun:sqlite';
import type { EmailStatus, EmailPriority } from '../../core/types/index.js';

export interface CreateEmailLogInput {
  jobId: string;
  tenantId: string;
  accountId?: string;
  toRecipients: string[];
  subject: string;
  priority?: EmailPriority;
  scheduledAt?: string;
  saveToSentItems?: boolean;
  isSync?: boolean;
}

export class EmailLogRepository {
  constructor(private db: Database) {}

  public create(input: CreateEmailLogInput): void {
    const stmt = this.db.prepare(`
      INSERT INTO email_logs (
        job_id, tenant_id, account_id, to_recipients, subject, status,
        priority, scheduled_at, save_to_sent_items, is_sync, attempts_history
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, COALESCE(?, datetime('now')), ?, ?, '[]')
    `);
    stmt.run(
      input.jobId,
      input.tenantId,
      input.accountId || null,
      JSON.stringify(input.toRecipients),
      input.subject,
      input.priority || 'normal',
      input.scheduledAt || null,
      input.saveToSentItems ? 1 : 0,
      input.isSync ? 1 : 0
    );
  }

  public findById(jobId: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM email_logs WHERE job_id = ?');
    return stmt.get(jobId);
  }

  public fetchNextJobForProcessing(): any | null {
    // Immediate transaction to acquire lock safely
    const fetchStmt = this.db.prepare(`
      SELECT * FROM email_logs
      WHERE status IN ('PENDING', 'THROTTLED')
        AND scheduled_at <= datetime('now')
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'normal' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END ASC,
        scheduled_at ASC
      LIMIT 1
    `);

    const updateStmt = this.db.prepare(`
      UPDATE email_logs
      SET status = 'PROCESSING', attempts = attempts + 1
      WHERE job_id = ?
    `);

    const transaction = this.db.transaction(() => {
      const job: any = fetchStmt.get();
      if (job) {
        updateStmt.run(job.job_id);
        job.status = 'PROCESSING';
        job.attempts += 1;
        return job;
      }
      return null;
    });

    return transaction();
  }

  public markSent(jobId: string, providerUsed: string, messageId?: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_logs
      SET status = 'SENT', provider_used = ?, message_id = ?, sent_at = datetime('now')
      WHERE job_id = ?
    `);
    stmt.run(providerUsed, messageId || null, jobId);
  }

  public markFailed(jobId: string, errorDetails: string, scheduledAt?: string, isFinalFail: boolean = false): void {
    const stmt = this.db.prepare(`
      UPDATE email_logs
      SET status = ?, error_details = ?, scheduled_at = COALESCE(?, scheduled_at)
      WHERE job_id = ?
    `);
    stmt.run(isFinalFail ? 'FAILED' : 'PENDING', errorDetails, scheduledAt || null, jobId);
  }

  public recordOpen(jobId: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_logs
      SET opened_at = COALESCE(opened_at, datetime('now')), open_count = open_count + 1
      WHERE job_id = ?
    `);
    stmt.run(jobId);
  }

  public recordClick(jobId: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_logs
      SET clicked_at = COALESCE(clicked_at, datetime('now')), click_count = click_count + 1
      WHERE job_id = ?
    `);
    stmt.run(jobId);
  }
}
