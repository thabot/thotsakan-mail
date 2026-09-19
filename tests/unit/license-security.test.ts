import { describe, expect, it, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { ClockTamperService, BreakGlassService } from '../../src/services/license-security.service.js';
import { runMigrations } from '../../src/database/db.js';

describe('ClockTamperService (Anti-Time-Rollback)', () => {
  let db: Database;
  let service: ClockTamperService;

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrations(db);
    service = new ClockTamperService(db);
  });

  it('should initialize and record current timestamp on first boot', () => {
    const now = 1774000000000;
    const result = service.verifyAndRecordTime(now);

    expect(result.isValid).toBe(true);
    expect(result.deltaMs).toBe(0);

    const row = db.prepare('SELECT value FROM system_metadata WHERE key = ?').get('last_known_timestamp') as any;
    expect(row.value).toBe(String(now));
  });

  it('should allow monotonic forward time progression', () => {
    const t0 = 1774000000000;
    service.verifyAndRecordTime(t0);

    const t1 = t0 + 60000; // 1 minute later
    const result1 = service.verifyAndRecordTime(t1);
    expect(result1.isValid).toBe(true);
    expect(result1.deltaMs).toBe(60000);

    const t2 = t1 + 3600000; // 1 hour later
    const result2 = service.verifyAndRecordTime(t2);
    expect(result2.isValid).toBe(true);
    expect(result2.deltaMs).toBe(3600000);
  });

  it('should tolerate minor NTP backward clock jitter (< 1 hour)', () => {
    const t0 = 1774000000000;
    service.verifyAndRecordTime(t0);

    // 5 seconds backward (e.g. NTP sync adjustment)
    const tSmallBack = t0 - 5000;
    const result = service.verifyAndRecordTime(tSmallBack);
    expect(result.isValid).toBe(true);
  });

  it('should detect and reject intentional clock rollback (> 1 hour)', () => {
    const t0 = 1774000000000;
    service.verifyAndRecordTime(t0);

    // 2 hours backward (attempting to revert expired license)
    const tMalicious = t0 - (2 * 60 * 60 * 1000);
    const result = service.verifyAndRecordTime(tMalicious);

    expect(result.isValid).toBe(false);
    expect(result.deltaMs).toBeLessThan(-3600000);
  });
});

describe('BreakGlassService (72h Emergency DR Failover)', () => {
  let db: Database;
  let service: BreakGlassService;

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrations(db);
    service = new BreakGlassService(db);
  });

  it('should not activate if emergency flag is false', () => {
    const result = service.evaluateBreakGlass(false);
    expect(result.isActive).toBe(false);
    expect(result.hoursRemaining).toBe(0);
    expect(result.isExpired).toBe(false);
  });

  it('should activate for 72 hours when emergency flag is true', () => {
    const now = 1774000000000;
    const result = service.evaluateBreakGlass(true, 'Host failure failover to VM-02', now);

    expect(result.isActive).toBe(true);
    expect(result.hoursRemaining).toBe(72);
    expect(result.isExpired).toBe(false);

    // Persisted in DB
    const startRow = db.prepare('SELECT value FROM system_metadata WHERE key = ?').get('break_glass_started_at') as any;
    expect(startRow.value).toBe(String(now));
  });

  it('should accurately calculate remaining hours as time passes', () => {
    const start = 1774000000000;
    service.evaluateBreakGlass(true, 'Test reason', start);

    // 24 hours later
    const dayLater = start + (24 * 60 * 60 * 1000);
    const resDayLater = service.evaluateBreakGlass(true, 'Test reason', dayLater);

    expect(resDayLater.isActive).toBe(true);
    expect(resDayLater.hoursRemaining).toBe(48);
    expect(resDayLater.isExpired).toBe(false);
  });

  it('should expire and reject activation when elapsed time exceeds 72 hours', () => {
    const start = 1774000000000;
    service.evaluateBreakGlass(true, 'Test reason', start);

    // 73 hours later
    const expiredTime = start + (73 * 60 * 60 * 1000);
    const result = service.evaluateBreakGlass(true, 'Test reason', expiredTime);

    expect(result.isActive).toBe(false);
    expect(result.hoursRemaining).toBe(0);
    expect(result.isExpired).toBe(true);
  });
});
