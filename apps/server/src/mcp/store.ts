import type { BoardStore } from "@doska/mcp"
import type { Change, Dashboard, DashboardChange } from "@doska/contract"
import {
  applyDashboardPush,
  applyPush,
  readDashboardsSince,
  readSince,
} from "../db/sync"

/**
 * The MCP tools' store, wired straight onto the sync tables — the same calls the
 * RPC router makes, one function call away instead of one HTTP hop.
 *
 * Reads ask for everything (`since: 0`)
 */
export class DbStore implements BoardStore {
  async readDashboards(): Promise<Dashboard[]> {
    const { changes } = await readDashboardsSince(0)
    return changes.map((change) => change.record)
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const { changes } = await readSince(boardId, 0)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    await applyDashboardPush(changes)
  }

  async pushBoard(boardId: string, changes: Change[]): Promise<void> {
    await applyPush(boardId, changes)
  }
}
