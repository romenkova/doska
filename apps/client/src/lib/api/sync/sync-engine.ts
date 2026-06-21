import { SyncEngine, type SyncState, type SyncStatus } from "@doska/sync"
import { DASHBOARDS } from "../constants"
import type { StoreName } from "../constants"
import { DeckSyncDriver } from "./drivers/board-driver"
import {
  DashboardListDriver,
  DASHBOARDS_SCOPE,
} from "./drivers/dashboard-list-driver"

/** Worst-case across the two channels: any syncing wins, then any error. */
function mergeStatus(a: SyncStatus, b: SyncStatus): SyncStatus {
  if (a === "syncing" || b === "syncing") return "syncing"
  if (a === "error" || b === "error") return "error"
  return "idle"
}

/**
 * The one sync facade the app drives. It runs two independent engines:
 *
 *  - the **board** engine, scoped to the open board (its columns and cards);
 *  - the **dashboard list** engine, account-level and always active, so other
 *    boards' create/rename/delete reach this client whatever board is open.
 *
 * Callers don't pick a channel: {@link markDirty} routes by store, and the UI
 * sees a single merged {@link SyncState}. There's one open board and one of each
 * dirty queue, so it's a singleton.
 */
class DeckSync {
  private readonly board = new SyncEngine(new DeckSyncDriver(), {
    storageKey: "deck:sync:dirty",
  })

  private readonly list = new SyncEngine(new DashboardListDriver(), {
    storageKey: "deck:sync:dirty:dashboards",
  })

  /** Merged snapshot, recomputed on either engine's transition and kept stable
   * between them so `useSyncExternalStore` doesn't loop. */
  private state: SyncState = { status: "idle", pending: 0 }

  private readonly listeners = new Set<() => void>()

  constructor() {
    this.board.subscribe(() => this.recompute())
    this.list.subscribe(() => this.recompute())
    this.recompute()
    // The list channel is board-independent, so it's active for good.
    this.list.setActiveScope(DASHBOARDS_SCOPE)
  }

  /** Recomputes the merged snapshot; notifies only on a real change. */
  private recompute() {
    const a = this.board.getState()
    const b = this.list.getState()
    const next: SyncState = {
      status: mergeStatus(a.status, b.status),
      pending: a.pending + b.pending,
    }
    if (next.status === this.state.status && next.pending === this.state.pending)
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
   * Selecting a board also refreshes the dashboard list (its own channel), so
   * the sidebar catches up the moment you navigate, not just on the next poll.
   */
  setActiveBoard(boardId: string | null) {
    this.board.setActiveScope(boardId)
    void this.list.reconcile()
  }

  /** Reconciles both channels once. */
  async reconcile(): Promise<void> {
    await Promise.all([this.board.reconcile(), this.list.reconcile()])
  }
}

export const sync = new DeckSync()
