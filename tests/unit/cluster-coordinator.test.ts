import { describe, expect, it, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { ClusterCoordinatorService } from '../../src/services/cluster-coordinator.service.js';
import { runMigrations } from '../../src/database/db.js';

describe('ClusterCoordinatorService (Multi-Node Quota Coordination)', () => {
  let db: Database;
  let coordinator: ClusterCoordinatorService;

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrations(db);
    coordinator = new ClusterCoordinatorService(db);
  });

  it('should register node heartbeat and retrieve active status', () => {
    coordinator.heartbeat('thk_mach_node_01');

    const result = coordinator.evaluateClusterCapacity('thk_mach_node_01', 1);
    expect(result.isAuthorized).toBe(true);
    expect(result.activeCount).toBe(1);
    expect(result.totalAllowed).toBe(1);
    expect(result.activeNodes[0].machineId).toBe('thk_mach_node_01');
  });

  it('should enforce instance_limit quota strictly across cluster nodes', () => {
    // 2-node cluster allowed
    coordinator.heartbeat('thk_mach_node_01');
    coordinator.heartbeat('thk_mach_node_02');

    // Node 1 & Node 2 are within quota of 2
    const res1 = coordinator.evaluateClusterCapacity('thk_mach_node_01', 2);
    expect(res1.isAuthorized).toBe(true);
    expect(res1.activeCount).toBe(2);

    const res2 = coordinator.evaluateClusterCapacity('thk_mach_node_02', 2);
    expect(res2.isAuthorized).toBe(true);

    // Node 3 attempts to join -> exceeds instance_limit of 2
    coordinator.heartbeat('thk_mach_node_03');

    const res3 = coordinator.evaluateClusterCapacity('thk_mach_node_03', 2);
    expect(res3.isAuthorized).toBe(false); // Quota exceeded!
    expect(res3.activeCount).toBe(3);
  });

  it('should evict stale dead nodes whose heartbeat stopped > 60s', () => {
    coordinator.heartbeat('thk_mach_active_node');
    coordinator.heartbeat('thk_mach_dead_node');

    // Force dead node heartbeat to be 100 seconds ago
    db.prepare("UPDATE cluster_nodes SET last_heartbeat_at = datetime('now', '-100 seconds') WHERE machine_id = ?")
      .run('thk_mach_dead_node');

    const result = coordinator.evaluateClusterCapacity('thk_mach_active_node', 1);

    expect(result.isAuthorized).toBe(true);
    expect(result.activeCount).toBe(1); // Dead node evicted
    expect(result.activeNodes[0].machineId).toBe('thk_mach_active_node');
  });
});
