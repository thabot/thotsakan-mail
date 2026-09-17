import type { Database } from 'bun:sqlite';
import { SuppressionRepository } from '../database/repositories/suppression.repository.js';

export class SuppressionService {
  private suppressionRepo: SuppressionRepository;

  constructor(private db: Database) {
    this.suppressionRepo = new SuppressionRepository(db);
  }

  /**
   * Check if any recipient in the list is suppressed
   */
  public checkSuppression(recipients: string[], tenantId: string): { isSuppressed: boolean; suppressedEmail?: string } {
    for (const email of recipients) {
      if (this.suppressionRepo.isSuppressed(email, tenantId)) {
        return { isSuppressed: true, suppressedEmail: email };
      }
    }
    return { isSuppressed: false };
  }

  public suppress(email: string, tenantId: string, reason: 'BOUNCE' | 'SPAM' | 'MANUAL' | 'UNSUBSCRIBE' = 'MANUAL'): void {
    this.suppressionRepo.add(email, tenantId, reason);
  }

  public unsuppress(email: string, tenantId: string): void {
    this.suppressionRepo.remove(email, tenantId);
  }

  public isSuppressed(email: string, tenantId: string): boolean {
    return this.suppressionRepo.isSuppressed(email, tenantId);
  }

  public list(tenantId: string, limit?: number): any[] {
    return this.suppressionRepo.list(tenantId, limit);
  }
}
