import type {
  Change,
  Dashboard,
  DashboardChange,
  Member,
} from "@doska/contract"

/**
 * The board, as the MCP tools need it — the sync protocol and nothing else:
 * reads hand back whole records (tombstones included), writes push whole records
 * under last-writer-wins, and a delete is a tombstone.
 *
 * The one implementation today is the server's (`apps/server`), straight onto
 * the sync tables. Whose boards those are belongs to the implementation, not
 * here: the tools never name a user. Making sense of what comes back — dropping
 * tombstones, ordering, splitting columns from cards — is `createBoard`'s job,
 * so no implementation has to do it.
 */
export type BoardStore = {
  readDashboards(): Promise<Dashboard[]>
  readBoard(boardId: string): Promise<Change[]>
  pushDashboards(changes: DashboardChange[]): Promise<void>
  pushBoard(boardId: string, changes: Change[]): Promise<void>
  /** Everyone with access to the board, the people a card can be assigned to. */
  readMembers(boardId: string): Promise<Member[]>
  /**
   * The timestamp to stamp a write with. A peer's own clock, not wall time:
   * `updatedAt` settles last-writer-wins, and a plain `Date.now()` here loses
   * every conflict against a record written by a device whose clock runs ahead
   * — silently, since a rejected write never reaches the tool that made it.
   */
  now(): number
}
