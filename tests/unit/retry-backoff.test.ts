import { describe, expect, it } from 'bun:test';
import { QueueWorker } from '../../src/workers/queue.worker.js';

describe('Unit: Retry Backoff Algorithm', () => {
  it('should calculate exponential backoff with jitter for each retry attempt', () => {
    // Formula: 15 * 2^attempts + jitter (0-4)
    // Attempt 1: 15 * 2^1 = 30 -> 30..34
    const delay1 = QueueWorker.calculateBackoff(1);
    expect(delay1).toBeGreaterThanOrEqual(30);
    expect(delay1).toBeLessThanOrEqual(34);

    // Attempt 2: 15 * 2^2 = 60 -> 60..64
    const delay2 = QueueWorker.calculateBackoff(2);
    expect(delay2).toBeGreaterThanOrEqual(60);
    expect(delay2).toBeLessThanOrEqual(64);

    // Attempt 3: 15 * 2^3 = 120 -> 120..124
    const delay3 = QueueWorker.calculateBackoff(3);
    expect(delay3).toBeGreaterThanOrEqual(120);
    expect(delay3).toBeLessThanOrEqual(124);
  });
});
