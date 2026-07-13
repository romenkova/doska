import type { BoardStore } from "@doska/mcp"
import {
  applyDashboardPush,
  applyPush,
  readDashboardsSince,
  readSince,
} from "../db/sync"

/**
 * The MCP tools' store, wired straight onto the sync tables — the same calls
 * the RPC router makes, one function call away instead of one HTTP hop.
 *
 * Reads ask for everything (`since: 0`): a tool wants the board as it stands,
 * not a delta, and there is no client here holding a cursor between calls.
 */
export const dbStore: BoardStore = {
  readDashboards: async () =>
    (await readDashboardsSince(0)).changes.map((change) => change.record),

  readBoard: async (boardId) => (await readSince(boardId, 0)).changes,

  pushDashboards: applyDashboardPush,

  pushBoard: applyPush,
}
