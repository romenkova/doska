import type { BoardStore } from "@doska/mcp"
import type { Change, Dashboard, DashboardChange } from "@doska/contract"
import { orpc } from "./rpc"

const DASHBOARDS = "dashboards"

/**
 * The board over the sync API — the server's only write surface, and the same
 * one the web and desktop apps use. Every call is push-then-pull: reading is a
 * push of nothing from `since: 0`, writing is a push of whole records.
 *
 * The pull is the catch: a call hands back everything past the `since` cursor we
 * sent. So an instance keeps the cursor each read returns and sends it on the
 * next write to that scope, or every write would drag the whole scope back with
 * it. Those cursors are why this is an instance and not a bag of functions:
 * two stores sharing them would hide each other's writes.
 */
export class SyncStore implements BoardStore {
  private readonly cursors = new Map<string, number>()

  async readDashboards(): Promise<Dashboard[]> {
    const { cursor, changes } = await orpc.dashboards.sync({
      since: 0,
      changes: [],
    })
    this.cursors.set(DASHBOARDS, cursor)
    return changes.map((change) => change.record)
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const { cursor, changes } = await orpc.board.sync({
      boardId,
      since: 0,
      changes: [],
    })
    this.cursors.set(boardId, cursor)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    const { cursor } = await orpc.dashboards.sync({
      since: this.cursors.get(DASHBOARDS) ?? 0,
      changes,
    })
    this.cursors.set(DASHBOARDS, cursor)
  }

  async pushBoard(boardId: string, changes: Change[]): Promise<void> {
    const { cursor } = await orpc.board.sync({
      boardId,
      since: this.cursors.get(boardId) ?? 0,
      changes,
    })
    this.cursors.set(boardId, cursor)
  }
}
