import { SyncEngine, type SyncState, type SyncStatus } from "@doska/sync"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"
import type { StoreName } from "../constants"
import { db } from "../db/db"
import { DeckSyncDriver } from "./drivers/board-driver"
import {
  DashboardListDriver,
  DASHBOARDS_SCOPE,
} from "./drivers/dashboard-list-driver"
import { FsBoardDriver } from "./drivers/fs-board-driver"
import { FsDashboardListDriver } from "./drivers/fs-dashboard-list-driver"
import { isAuthed } from "@/lib/utils"
import {
  getSyncFolder,
  getSyncTarget,
  isDesktop,
  isSyncConfigured,
  subscribeSyncConfig,
  type SyncTarget,
} from "../runtime"

/**
 * Sync runs only when the active backend is reachable — a signed-in server, or a
 * chosen folder on desktop. The folder backend has no account, so it doesn't
 * require auth. Otherwise every engine no-ops and the app stays purely local.
 */
const canSync = () =>
  isSyncConfigured() && (getSyncTarget() === "folder" || isAuthed())

/** The board + dashboard-list driver pair for a backend. */
function createDrivers(target: SyncTarget) {
  if (target === "folder")
    return { board: new FsBoardDriver(), list: new FsDashboardListDriver() }
  return { board: new DeckSyncDriver(), list: new DashboardListDriver() }
}

/** Worst-case across the two channels: any syncing wins, then any error. */
function mergeStatus(a: SyncStatus, b: SyncStatus): SyncStatus {
  if (a === "syncing" || b === "syncing") return "syncing"
  if (a === "error" || b === "error") return "error"
  return "idle"
}

/** Debounce window for coalescing a burst of filesystem-watch events. */
const WATCH_DEBOUNCE_MS = 300

/**
 * The one sync facade the app drives. It runs two independent engines:
 *
 *  - the **board** engine, scoped to the open board (its columns and cards);
 *  - the **dashboard list** engine, account-level and always active.
 *
 * The engines' drivers depend on the configured backend (server or folder), so
 * the facade **rebuilds** both when the backend changes — reusing the same dirty
 * queues (keyed by `storageKey`), so pending local edits flush to whichever
 * backend is now active. On the folder backend it also watches the folder to
 * pick up external edits near-realtime.
 *
 * Callers don't pick a channel: {@link markDirty} routes by store, and the UI
 * sees a single merged {@link SyncState}. There's one open board and one of each
 * dirty queue, so it's a singleton.
 */
class DeckSync {
  private board!: SyncEngine<string, never>
  private list!: SyncEngine<string, never>

  /** The open board, remembered so a backend swap can re-point the new engine. */
  private currentBoard: string | null = null

  /** Tears down the active folder watcher, if any. */
  private stopWatch: (() => void) | null = null

  private state: SyncState = { status: "idle", pending: 0 }
  private readonly listeners = new Set<() => void>()

  constructor() {
    this.rebuild()
    // Rebuild whenever the backend target/folder/URL changes.
    subscribeSyncConfig(() => this.rebuild())
  }

  /**
   * (Re)builds both engines from the current backend and re-points them at the
   * open scopes. Safe to call repeatedly; the old engines are simply dropped.
   */
  private rebuild() {
    const { board, list } = createDrivers(getSyncTarget())
    // The generic engine is Change-shaped per backend; the facade only routes
    // dirty refs and reads status, so the change type is erased to `never`.
    this.board = new SyncEngine(board, {
      storageKey: "deck:sync:dirty",
      canSync,
    }) as unknown as SyncEngine<string, never>
    this.list = new SyncEngine(list, {
      storageKey: "deck:sync:dirty:dashboards",
      canSync,
    }) as unknown as SyncEngine<string, never>

    this.board.subscribe(() => this.recompute())
    this.list.subscribe(() => this.recompute())
    this.list.setActiveScope(DASHBOARDS_SCOPE)
    this.board.setActiveScope(this.currentBoard)

    void this.startWatch()
    this.recompute()
  }

  /**
   * Watches the sync folder (desktop + folder backend only) and reconciles,
   * debounced, on any change — so external edits show up without waiting for the
   * poll. A no-op (and tears down any prior watcher) on other backends.
   */
  private async startWatch() {
    this.stopWatch?.()
    this.stopWatch = null
    if (getSyncTarget() !== "folder" || !isDesktop()) return
    const folder = getSyncFolder()
    if (!folder) return

    const { watch } = await import("./fs/fs-adapter")
    let timer: ReturnType<typeof setTimeout> | null = null
    const onChange = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void this.reconcile(), WATCH_DEBOUNCE_MS)
    }
    try {
      this.stopWatch = await watch(folder, onChange)
    } catch (err) {
      console.warn("[sync] folder watch failed; falling back to poll", err)
    }
  }

  /** Recomputes the merged snapshot; notifies only on a real change. */
  private recompute() {
    const a = this.board.getState()
    const b = this.list.getState()
    const next: SyncState = {
      status: mergeStatus(a.status, b.status),
      pending: a.pending + b.pending,
    }
    if (
      next.status === this.state.status &&
      next.pending === this.state.pending
    )
      return
    this.state = next
    for (const listener of this.listeners) listener()
  }

  /** Subscribes to merged state changes; shaped for `useSyncExternalStore`. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** The current merged snapshot, stable until the next transition. */
  getState = (): SyncState => this.state

  /** Flags a record as changed locally, routing it to the channel that owns it. */
  markDirty(store: StoreName, key: string) {
    const engine = store === DASHBOARDS ? this.list : this.board
    engine.mark(`${store}/${key}`)
  }

  /**
   * Points the board channel at the open board and reconciles immediately.
   * Selecting a board also refreshes the dashboard list (its own channel).
   */
  setActiveBoard(boardId: string | null) {
    this.currentBoard = boardId
    this.board.setActiveScope(boardId)
    void this.list.reconcile()
  }

  /** Reconciles both channels once. Each engine no-ops while not configured. */
  async reconcile(): Promise<void> {
    await Promise.all([this.board.reconcile(), this.list.reconcile()])
  }

  /**
   * Enqueues every live local record so a fresh backend receives the current
   * boards, not just future edits. Used when switching to the folder backend:
   * without it the push write-phase (dirty-only) would leave an empty folder.
   *
   * Board folders + their `_index.md` export immediately via the always-on list
   * channel; a board's columns and cards flush when that board is next active
   * (the board channel is per-board), so the open board exports right away and
   * the rest as they're visited.
   */
  async exportLocalData(): Promise<void> {
    const [dashboards, columns, cards] = await Promise.all([
      db.getDashboards(),
      db.getColumns(),
      db.getCards(),
    ])
    for (const d of dashboards)
      if (d.deletedAt == null) this.markDirty(DASHBOARDS, d.id)
    for (const c of columns)
      if (c.deletedAt == null) this.markDirty(COLUMNS, c.id)
    for (const c of cards) if (c.deletedAt == null) this.markDirty(CARDS, c.id)
    await this.reconcile()
  }
}

export const sync = new DeckSync()
