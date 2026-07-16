import {
  SyncEngine,
  type SyncFailure,
  type SyncState,
  type SyncStatus,
} from "@doska/sync"
import { ORPCError } from "@orpc/client"
import type { StoreName } from "../constants"
import { DASHBOARDS } from "../constants"
import { DeckSyncDriver } from "./drivers/board-driver"
import {
  DashboardListDriver,
  DASHBOARDS_SCOPE,
} from "./drivers/dashboard-list-driver"
import { isAuthed, subscribeAuthed } from "@/lib/utils"
import { isSyncConfigured, subscribeSyncConfig } from "../server"

/**
 * Sync runs only against a reachable, signed-in server. Otherwise every engine
 * no-ops and the app stays purely local.
 */
const canSync = () => isSyncConfigured() && isAuthed()

/**
 * Reads the reason for a failed reconcile out of the transport.
 */
const classify = (err: unknown): SyncFailure => {
  if (!navigator.onLine) return "offline"
  if (err instanceof ORPCError)
    return err.status === 401 || err.status === 403 ? "auth" : "server"
  if (err instanceof TypeError) return "offline"
  return "server"
}

const createDrivers = () => ({
  board: new DeckSyncDriver(),
  list: new DashboardListDriver(),
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
    const { board, list } = createDrivers()
    // The generic engine is Change-shaped per channel; the facade only routes
    // dirty refs and reads status, so the change type is erased to `never`.
    this.board = new SyncEngine(board, {
      storageKey: "deck:sync:dirty",
      canSync,
      classify,
    }) as unknown as SyncEngine<string, never>
    this.list = new SyncEngine(list, {
      storageKey: "deck:sync:dirty:dashboards",
      canSync,
      classify,
    }) as unknown as SyncEngine<string, never>

    this.board.subscribe(() => this.recompute())
    this.list.subscribe(() => this.recompute())
    this.list.setActiveScope(DASHBOARDS_SCOPE)
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
    const engine = store === DASHBOARDS ? this.list : this.board
    engine.mark(`${store}/${key}`)
  }

  setActiveBoard(boardId: string | null) {
    this.currentBoard = boardId
    this.board.setActiveScope(boardId)
    void this.list.reconcile()
  }

  /** Reconciles both channels once. Each engine no-ops while not configured. */
  async reconcile(): Promise<void> {
    await Promise.all([this.board.reconcile(), this.list.reconcile()])
  }
}

export const sync = new DeckSync()
