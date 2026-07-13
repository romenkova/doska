import type { BoardStore } from "@doska/mcp"
import { orpc } from "./rpc"

/**
 * The board over the sync API — the server's only write surface, and the same
 * one the web and desktop apps use. Every call is push-then-pull: reading is a
 * push of nothing from `since: 0`, writing is a push of whole records.
 *
 * The pull is the catch: a call hands back everything past the `since` cursor
 * we sent. So we keep the cursor each read returns and send it on the next
 * write to that scope, or every write would drag the whole scope back with it.
 */

const cursors = new Map<string, number>()
const DASHBOARDS = "dashboards"

export const syncStore: BoardStore = {
  async readDashboards() {
    const { cursor, changes } = await orpc.dashboards.sync({
      since: 0,
      changes: [],
    })
    cursors.set(DASHBOARDS, cursor)
    return changes.map((change) => change.record)
  },

  async readBoard(boardId) {
    const { cursor, changes } = await orpc.board.sync({
      boardId,
      since: 0,
      changes: [],
    })
    cursors.set(boardId, cursor)
    return changes
  },

  async pushDashboards(changes) {
    const { cursor } = await orpc.dashboards.sync({
      since: cursors.get(DASHBOARDS) ?? 0,
      changes,
    })
    cursors.set(DASHBOARDS, cursor)
  },

  async pushBoard(boardId, changes) {
    const { cursor } = await orpc.board.sync({
      boardId,
      since: cursors.get(boardId) ?? 0,
      changes,
    })
    cursors.set(boardId, cursor)
  },
}
