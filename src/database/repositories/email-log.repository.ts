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
  messagePayload?: any;
}

export interface EmailLogFilter {
  tenantId?: string;
  status?: EmailStatus;
  recipient?: string;
  limit?: number;
  offset?: number;
}

export class EmailLogRepository {
  constructor(private db: Database) {}

  public create(input: CreateEmailLogInput): void {
    const stmt = this.db.prepare(`
      INSERT INTO email_logs (
        job_id, tenant_id, account_id, to_recipients, subject, status,
        priority, scheduled_at, save_to_sent_items, is_sync, message_payload, attempts_history
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, COALESCE(datetime(?), datetime('now')), ?, ?, ?, '[]')
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
      input.isSync ? 1 : 0,
      input.messagePayload ? JSON.stringify(input.messagePayload) : null
    );
  }

  public findById(jobId: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM email_logs WHERE job_id = ?');
    return stmt.get(jobId);
  }

  public findLogs(filter: EmailLogFilter): any[] {
    let sql = 'SELECT * FROM email_logs WHERE 1=1';
    const params: any[] = [];

    if (filter.tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(filter.tenantId);
    }
    if (filter.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter.recipient) {
      sql += ' AND to_recipients LIKE ?';
      params.push(`%${filter.recipient}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(filter.limit || 50);
    params.push(filter.offset || 0);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  public getOverviewMetrics(tenantId?: string): {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    processing: number;
    suppressed: number;
  } {
    let sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN ('PENDING', 'THROTTLED') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'SUPPRESSED' THEN 1 ELSE 0 END) as suppressed
      FROM email_logs
    `;
    const params: any[] = [];
    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }
    const stmt = this.db.prepare(sql);
    const row: any = stmt.get(...params);
    return {
      total: row?.total || 0,
      sent: row?.sent || 0,
      failed: row?.failed || 0,
      pending: row?.pending || 0,
      processing: row?.processing || 0,
      suppressed: row?.suppressed || 0,
    };
  }

  public fetchNextJobForProcessing(): any | null {
    // Immediate transaction to acquire lock safely
    const fetchStmt = this.db.prepare(`
      SELECT * FROM email_logs
      WHERE status IN ('PENDING', 'THROTTLED')
        AND datetime(scheduled_at) <= datetime('now')
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'normal' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END ASC,
        datetime(scheduled_at) ASC
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

  public markSuppressed(jobId: string, reason: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_logs
      SET status = 'SUPPRESSED', error_details = ?
      WHERE job_id = ?
    `);
    stmt.run(reason, jobId);
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

