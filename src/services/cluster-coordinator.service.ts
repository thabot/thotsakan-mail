import type { Database } from 'bun:sqlite';
import os from 'os';

export interface ClusterNodeInfo {
  machineId: string;
  hostname: string;
  ipAddress: string;
  pid: number;
  firstSeenAt: string;
  lastHeartbeatAt: string;
  isActive: boolean;
}

export class ClusterCoordinatorService {
  private db: Database;
  private readonly STALE_THRESHOLD_SECONDS = 60; // Nodes without heartbeat in 60s are considered dead

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Registers or updates heartbeat for the current node
   */
  public heartbeat(machineId: string): void {
    const hostname = os.hostname();
    const pid = process.pid;

    // Get primary IPv4 address
    let ipAddress = '127.0.0.1';
    const interfaces = os.networkInterfaces();
    for (const ifaceList of Object.values(interfaces)) {
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (!iface.internal && iface.family === 'IPv4') {
          ipAddress = iface.address;
          break;
        }
      }
    }

    this.db.prepare(`
      INSERT INTO cluster_nodes (machine_id, hostname, ip_address, pid, first_seen_at, last_heartbeat_at, is_active)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)
      ON CONFLICT(machine_id) DO UPDATE SET
        hostname = excluded.hostname,
        ip_address = excluded.ip_address,
        pid = excluded.pid,
        last_heartbeat_at = datetime('now'),
        is_active = 1
    `).run(machineId, hostname, ipAddress, pid);
  }

  /**
   * Evaluates active nodes in the cluster and validates against instance_limit
   */
  public evaluateClusterCapacity(currentMachineId: string, instanceLimit: number = 1): {
    isAuthorized: boolean;
    activeCount: number;
    totalAllowed: number;
    activeNodes: ClusterNodeInfo[];
  } {
    // 1. Mark stale nodes as inactive
    this.db.prepare(`
      UPDATE cluster_nodes 
      SET is_active = 0 
      WHERE is_active = 1 
        AND strftime('%s', 'now') - strftime('%s', last_heartbeat_at) > ?
    `).run(this.STALE_THRESHOLD_SECONDS);

    // 2. Query active nodes ordered by first_seen_at ASC
    const activeNodes = this.db.prepare(`
      SELECT 
        machine_id as machineId, 
        hostname, 
        ip_address as ipAddress, 
        pid, 
        first_seen_at as firstSeenAt, 
        last_heartbeat_at as lastHeartbeatAt, 
        is_active as isActive
      FROM cluster_nodes
      WHERE is_active = 1
      ORDER BY first_seen_at ASC
    `).all() as unknown as ClusterNodeInfo[];

    const activeCount = activeNodes.length;

    // 3. Determine if currentMachineId is within the allowed quota rank
    const currentRankIndex = activeNodes.findIndex(node => node.machineId.toLowerCase() === currentMachineId.toLowerCase());

    // If current node is within quota (rank 0 .. instanceLimit - 1), it is authorized
    const isAuthorized = currentRankIndex !== -1 && currentRankIndex < instanceLimit;

    return {
      isAuthorized,
      activeCount,
      totalAllowed: instanceLimit,
      activeNodes,
    };
  }
}
