import { describe, expect, it } from 'bun:test';
import { AppLifecycleManager } from '../../src/core/lifecycle/lifecycle.manager.js';

describe('AppLifecycleManager (Graceful Shutdown)', () => {
  const manager = AppLifecycleManager.getInstance();

  it('should track in-flight active jobs count accurately', () => {
    const initial = manager.getActiveJobsCount();
    expect(manager.trackJobStart()).toBe(true);
    expect(manager.getActiveJobsCount()).toBe(initial + 1);

    manager.trackJobEnd();
    expect(manager.getActiveJobsCount()).toBe(initial);
  });

  it('should execute registered cleanup handlers on shutdown', async () => {
    let cleanupRan = false;
    manager.registerCleanupHandler(() => {
      cleanupRan = true;
    });

    await manager.shutdown(1000);
    expect(cleanupRan).toBe(true);
    expect(manager.isTerminating()).toBe(true);

    // After shutdown, trackJobStart must return false
    expect(manager.trackJobStart()).toBe(false);
  });
});
