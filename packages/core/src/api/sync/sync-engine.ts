import {
  SyncEngine,
  type SyncFailure,
  type SyncState,
  type SyncStatus,
} from "@doska/sync"
import { ORPCError } from "@orpc/client"
import type { StoreName } from "../constants"
import { DASHBOARDS, SIDEBAR } from "../constants"
import { DeckSyncDriver } from "./drivers/board-driver"
import {
  DashboardListDriver,
  DASHBOARDS_SCOPE,
} from "./drivers/dashboard-list-driver"
import { dropBoardLocally } from "../operations/drop-board-locally"
import { isAuthed, subscribeAuthed } from "../../utils"
import { runtime } from "../../runtime"
import { isSyncConfigured, subscribeSyncConfig } from "../server"

/**
 * Sync runs only against a reachable, signed-in server. Otherwise every engine
 * no-ops and the app stays purely local.
 */
const canSync = () => isSyncConfigured() && isAuthed()

/**
 * Reads the reason for a failed reconcile out of the transport.
 *
 * 401 and 403 are deliberately different: 401 is the session, 403 is one board
 * we may not have. Folding 403 into `auth` would tell a signed-in user they had
 * been signed out because a single board turned them away.
 */
export const classify = (err: unknown): SyncFailure => {
  if (!runtime().net.online()) return "offline"
  if (err instanceof ORPCError) {
    if (err.status === 401) return "auth"
    if (err.status === 403) return "forbidden"
    return "server"
  }
  if (err instanceof TypeError) return "offline"
  return "server"
}

const LIST_STORES: StoreName[] = [DASHBOARDS, SIDEBAR]

const createDrivers = (onRemoved: (boardId: string) => Promise<void>) => ({
  board: new DeckSyncDriver(),
  list: new DashboardListDriver(onRemoved),
})

/**
 * Worst-case across the two channels
 */
function mergeStatus(a: SyncStatus, b: SyncStatus): SyncStatus {
  if (a === "syncing" || b === "syncing") return "syncing"
  if (a === "error" || b === "error") return "error"
  if (a === "paused" || b === "paused") return "paused"
  return "idle"
}

/** The newer of two successes; null only when neither channel has ever synced. */
function mergeLastSynced(a: number | null, b: number | null): number | null {
  if (a === null) return b
  if (b === null) return a
  return Math.max(a, b)
}

/**
 * The one sync facade the app drives. Runs two independent engines: the board
 * engine (scoped to the open board) and the always-active dashboard-list engine.
 * Both are rebuilt when the server URL changes, reusing the same dirty queues so
 * pending edits flush to whichever server is now active. Callers don't pick a
 * channel — {@link markDirty} routes by store and the UI sees one merged
 * {@link SyncState}. Singleton.
 */
class DeckSync {
  private board!: SyncEngine<string, never>
  private list!: SyncEngine<string, never>

  /** The open board, remembered so a rebuild can re-point the new engine. */
  private currentBoard: string | null = null

  /** Watched boards, remembered for the same reason. */
  private watchedBoards: string[] = []

  private state: SyncState = {
    status: "idle",
    pending: 0,
    failures: 0,
    lastSyncedAt: null,
    failure: null,
  }
  private readonly listeners = new Set<() => void>()

  constructor() {
    this.rebuild()
    subscribeSyncConfig(() => this.rebuild())
    subscribeAuthed(() => void this.reconcile())
  }

  // Safe to call repeatedly; the old engines are simply dropped.
  private rebuild() {
    const { board, list } = createDrivers((boardId) => this.forget(boardId))
    // The generic engine is Change-shaped per channel; the facade only routes
    // dirty refs and reads status, so the change type is erased to `never`.
    this.board = new SyncEngine(board, {
      kv: runtime().kv,
      storageKey: "deck:sync:dirty",
      canSync,
      classify,
      onForbidden: (boardId) => this.forget(boardId),
    }) as unknown as SyncEngine<string, never>
    this.list = new SyncEngine(list, {
      kv: runtime().kv,
      storageKey: "deck:sync:dirty:dashboards",
      canSync,
      classify,
    }) as unknown as SyncEngine<string, never>

    this.board.subscribe(() => this.recompute())
    this.list.subscribe(() => this.recompute())
    this.list.setActiveScope(DASHBOARDS_SCOPE)
    this.board.watchScopes(this.watchedBoards)
    this.board.setActiveScope(this.currentBoard)

    this.recompute()
  }

  // Notifies only on a real transition.
  private recompute() {
    const a = this.board.getState()
    const b = this.list.getState()
    const prev = this.state
    const next: SyncState = {
      status: mergeStatus(a.status, b.status),
      pending: a.pending + b.pending,
      // The longest-running failure, so a channel that has been down for a
      // while isn't masked by one that only just started failing.
      failures: Math.max(a.failures, b.failures),
      lastSyncedAt: mergeLastSynced(a.lastSyncedAt, b.lastSyncedAt),
      failure: a.failure ?? b.failure,
    }
    if (
      next.status === prev.status &&
      next.pending === prev.pending &&
      next.failures === prev.failures &&
      next.lastSyncedAt === prev.lastSyncedAt &&
      next.failure === prev.failure
    )
      return
    this.state = next
    for (const listener of this.listeners) listener()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = (): SyncState => this.state

  markDirty(store: StoreName, key: string) {
    this.engineFor(store).mark(`${store}/${key}`)
  }

  /** Whether a record still owes the server a push — see `purgeExpired`. */
  isDirty(store: StoreName, key: string): boolean {
    return this.engineFor(store).dirty.has(`${store}/${key}`)
  }

  private engineFor(store: StoreName) {
    return LIST_STORES.includes(store) ? this.list : this.board
  }

  /** Abandons these records' pending refs, routed to the channel that holds them. */
  dropDirty(store: StoreName, ids: string[]) {
    this.engineFor(store).dropDirty(ids.map((id) => `${store}/${id}`))
  }

  /** A board the server refuses, or has stopped sharing with us */
  private async forget(boardId: string): Promise<void> {
    if (this.currentBoard === boardId) this.currentBoard = null
    this.watchedBoards = this.watchedBoards.filter((id) => id !== boardId)
    this.board.dropScope(boardId)
    await dropBoardLocally(boardId, (store, ids) => this.dropDirty(store, ids))
  }

  /**
   * Drops both channels' pending refs
   */
  clearDirty() {
    this.board.clearDirty()
    this.list.clearDirty()
  }

  /**
   * Points both channels back at nothing
   */
  reset() {
    this.currentBoard = null
    this.watchedBoards = []
    this.board.reset()
    this.list.reset()
    this.list.setActiveScope(DASHBOARDS_SCOPE)
  }

  /**
   * The dashboard list always goes first. A board's tombstone cascades onto
   * anything pushed for it (see `applyPush`), so a restore whose card push
   * overtook its board push would come straight back dead. Serialising costs a
   * round-trip on a background poll; the ordering is a correctness property.
   */
  private async listFirst(run: () => Promise<void>): Promise<void> {
    await this.list.reconcile()
    await run()
  }

  setActiveBoard(boardId: string | null) {
    this.currentBoard = boardId
    void this.listFirst(async () => this.board.setActiveScope(boardId))
  }

  /**
   * Pulls every listed board once, leaving the active board as it is.
   */
  reconcileBoards(boardIds: string[]): Promise<void> {
    return this.listFirst(() => this.board.reconcileScopes(boardIds))
  }

  /**
   * Polls these boards while a cross-board view is open. The digest sets no
   * active board, so without this nothing pulls. Pass `[]` on the way out.
   */
  watchBoards(boardIds: string[]): Promise<void> {
    this.watchedBoards = boardIds
    this.board.watchScopes(boardIds)
    return this.reconcile()
  }

  /** Reconciles both channels once. Each engine no-ops while not configured. */
  reconcile(): Promise<void> {
    return this.listFirst(() => this.board.reconcile())
  }
}

export const sync = new DeckSync()
