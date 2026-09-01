import type { BoardStore } from "@doska/mcp"
import type { Change, Dashboard, DashboardChange } from "@doska/contract"
import { ORPCError } from "@orpc/server"
import { HybridClock } from "@doska/sync/hlc"
import { boardSync, boardsListSync } from "../db/sync"

const clock = new HybridClock()

/**
 * A board owned by someone else reads to an agent as a board that isn't there
 */
async function checkMissing<T>(boardId: string, run: Promise<T>): Promise<T> {
  try {
    return await run
  } catch (err) {
    if (err instanceof ORPCError && err.code === "FORBIDDEN")
      throw new Error(`No board ${boardId}`, { cause: err })
    throw err
  }
}

/**
 * The MCP tools' store, wired straight onto the sync tables — the same calls the
 * RPC router makes, one function call away instead of one HTTP hop.
 */
export class DbStore implements BoardStore {
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  now(): number {
    return clock.now()
  }

  async readDashboards(): Promise<Dashboard[]> {
    const { changes } = await boardsListSync.readSince(0, this.userId)
    const records = changes.map((change) => change.record)
    for (const record of records) clock.receive(record.updatedAt)
    return records
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const { changes } = await checkMissing(
      boardId,
      boardSync.readSince(boardId, 0, this.userId)
    )
    for (const change of changes) clock.receive(change.record.updatedAt)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    await boardsListSync.applyPush(changes, this.userId)
  }

  async pushBoard(boardId: string, changes: Change[]): Promise<void> {
    await checkMissing(
      boardId,
      boardSync.applyPush(boardId, changes, this.userId)
    )
  }
}
