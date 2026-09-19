import type { Database } from 'bun:sqlite';

export class ClockTamperService {
  private db: Database;
  private readonly SKEW_THRESHOLD_MS = 60 * 60 * 1000; // 1 Hour allowance (NTP jitter vs intentional rollback)

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Verifies that the current system clock has not been rolled back in an attempt to bypass license expiration
   */
  public verifyAndRecordTime(currentTimeMs: number = Date.now()): { isValid: boolean; deltaMs: number } {
    const row = this.db.prepare('SELECT value FROM system_metadata WHERE key = ?').get('last_known_timestamp') as { value: string } | undefined;

    if (!row) {
      // First boot or initialization: record current time
      this.db.prepare(
        'INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
      ).run('last_known_timestamp', String(currentTimeMs));
      return { isValid: true, deltaMs: 0 };
    }

    const lastKnownTimestamp = Number(row.value);
    const deltaMs = currentTimeMs - lastKnownTimestamp;

    // If current time is earlier than last known timestamp by more than 1 hour, clock has been tampered with
    if (deltaMs < -this.SKEW_THRESHOLD_MS) {
      console.error(`🚨 [SECURITY ALERT] System clock rollback detected! Current: ${new Date(currentTimeMs).toISOString()}, Last recorded: ${new Date(lastKnownTimestamp).toISOString()} (Delta: ${Math.round(deltaMs / 1000)}s)`);
      return { isValid: false, deltaMs };
    }

    // Advance last known timestamp forward if current time is strictly later
    if (currentTimeMs > lastKnownTimestamp) {
      this.db.prepare(
        'INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
      ).run('last_known_timestamp', String(currentTimeMs));
    }

    return { isValid: true, deltaMs };
  }
}

export class BreakGlassService {
  private db: Database;
  private readonly MAX_BREAK_GLASS_HOURS = 72; // Maximum emergency window: 72 hours (3 days)

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Checks or initiates emergency break-glass mode for disaster recovery (DR)
   */
  public evaluateBreakGlass(
    isEmergencyFlagActive: boolean = false,
    reason?: string,
    currentTimeMs: number = Date.now()
  ): { isActive: boolean; hoursRemaining: number; isExpired: boolean } {
    if (!isEmergencyFlagActive) {
      return { isActive: false, hoursRemaining: 0, isExpired: false };
    }

    const row = this.db.prepare('SELECT value FROM system_metadata WHERE key = ?').get('break_glass_started_at') as { value: string } | undefined;

    let startTimeMs: number;

    if (!row) {
      startTimeMs = currentTimeMs;
      this.db.prepare(
        'INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))'
      ).run('break_glass_started_at', String(startTimeMs));

      if (reason) {
        this.db.prepare(
          'INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
        ).run('break_glass_reason', reason);
      }

      console.warn(`🚨 [DISASTER RECOVERY] Emergency Break-Glass Mode ACTIVATED for 72 hours. Reason: ${reason || 'Emergency Failover'}`);
    } else {
      startTimeMs = Number(row.value);
    }

    const elapsedHours = (currentTimeMs - startTimeMs) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, Math.round((this.MAX_BREAK_GLASS_HOURS - elapsedHours) * 10) / 10);

    if (elapsedHours > this.MAX_BREAK_GLASS_HOURS) {
      console.warn(`⚠️ [DISASTER RECOVERY] Emergency Break-Glass Mode has EXPIRED (Elapsed: ${Math.round(elapsedHours)}h > ${this.MAX_BREAK_GLASS_HOURS}h). Gracefully reverting to COMMUNITY.`);
      return { isActive: false, hoursRemaining: 0, isExpired: true };
    }

    return { isActive: true, hoursRemaining, isExpired: false };
  }
}
