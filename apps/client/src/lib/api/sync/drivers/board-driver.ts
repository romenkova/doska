import type { Change } from "@deck/contract"
import type { DirtyStore, SyncDriver } from "@deck/sync"
import type { Card, Column, Dashboard } from "@/lib/types"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { idb, META_STORE } from "../../db/idb"
import { orpc } from "../orpc"
import { queryClient } from "@/lib/query-client"
import { keys } from "@/lib/data/keys"

/** meta-store key prefix for the per-board pull cursor (server seq). */
const CURSOR_PREFIX = "cursor:"

/**
 * Wires the generic sync engine to deck: a board is the sync scope, oRPC's
 * `board.sync` is the transport, and changes/cursors live in IndexedDB. Carries
 * a board's columns and cards only — the dashboard list rides its own
 * board-independent channel (see `dashboard-list-driver`).
 */
export class DeckSyncDriver implements SyncDriver<string, Change> {
  /**
   * Reads a board's last pull cursor; 0 means "pull everything" on first sync.
   * Lives in IndexedDB beside the data so clearing the local DB resets it too —
   * otherwise a stale cursor would hide every server change after a wipe.
   */
  async loadCursor(boardId: string): Promise<number> {
    const raw = await idb.get<number>(META_STORE, CURSOR_PREFIX + boardId)
    return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
  }

  /** Persists a board's cursor so a reload resumes the pull where it left off. */
  async saveCursor(boardId: string, value: number): Promise<void> {
    try {
      await idb.set(META_STORE, CURSOR_PREFIX + boardId, value)
    } catch {
      // Storage unavailable; the next sync re-pulls from the in-memory cursor.
    }
  }

  /**
   * Resolves the dirty refs that belong to `boardId` into a `Change[]` to push,
   * alongside the refs consumed (so they can be restored if the push fails).
   * Refs for other *live* boards stay dirty and push when their board is active.
   */
  async collectChanges(
    boardId: string,
    dirty: DirtyStore
  ): Promise<{ changes: Change[]; refs: string[] }> {
    const changes: Change[] = []
    const refs: string[] = []
    // Refs that can never be pushed because their record (or its board) is gone.
    const dead: string[] = []

    for (const ref of dirty.all()) {
      const [store, id] = ref.split("/")

      switch (store) {
        case COLUMNS: {
          const record = await idb.get<Column>(COLUMNS, id)
          if (!record) {
            dead.push(ref)
            break
          }
          if (await this.boardDeleted(record.dashboardId)) {
            dead.push(ref)
            break
          }
          if (record.dashboardId === boardId) {
            changes.push({ store, record })
            refs.push(ref)
          }
          break
        }
        case CARDS: {
          const record = await idb.get<Card>(CARDS, id)
          if (!record) {
            dead.push(ref)
            break
          }

          const column = await idb.get<Column>(COLUMNS, record.columnId)
          // Orphaned: the owning column is gone.
          if (!column) {
            dead.push(ref)
            break
          }
          // The owning board was deleted
          if (await this.boardDeleted(column.dashboardId)) {
            dead.push(ref)
            break
          }
          if (column.dashboardId === boardId) {
            changes.push({ store, record })
            refs.push(ref)
          }
          break
        }
        default:
          // Not a board entity (e.g. a dashboards ref left over from before the
          // list moved to its own channel): nothing here can push it.
          dead.push(ref)
      }
    }

    if (dead.length) dirty.clear(dead)

    return { changes, refs }
  }

  private async boardDeleted(dashboardId: string): Promise<boolean> {
    const dashboard = await idb.get<Dashboard>(DASHBOARDS, dashboardId)
    return !dashboard || dashboard.deletedAt != null
  }

  push(input: { scope: string; since: number; changes: Change[] }) {
    return orpc.board.sync({
      boardId: input.scope,
      since: input.since,
      changes: input.changes,
    })
  }

  async applyRemote(boardId: string, changes: Change[]): Promise<void> {
    const touchedCards: string[] = []
    let touchedBoard = false

    for (const { store, record } of changes) {
      const existing = await idb.get<{ updatedAt: number }>(store, record.id)
      if (existing && existing.updatedAt >= record.updatedAt) continue
      await idb.set(store, record.id, record)

      if (store === CARDS) {
        touchedCards.push(record.id)
        touchedBoard = true
      } else if (store === COLUMNS) {
        touchedBoard = true
      }
    }

    if (touchedBoard)
      queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
    for (const id of touchedCards)
      queryClient.invalidateQueries({ queryKey: keys.card(id) })
  }

  refOf(change: Change): string {
    return `${change.store}/${change.record.id}`
  }

  /**
   * Hard-deletes local tombstones that have already reached the server,
   * reclaiming IndexedDB space so deleted records don't accumulate forever.
   * Candidates are `store/id` refs; any still dirty (re-touched before this push
   * landed) are kept.
   */
  async compact(dirty: DirtyStore, refs: string[]): Promise<void> {
    for (const ref of refs) {
      if (dirty.has(ref)) continue
      const [store, id] = ref.split("/")
      try {
        const record = await idb.get<{ deletedAt: number | null }>(store, id)
        if (record?.deletedAt != null) await idb.delete(store, id)
      } catch (err) {
        console.warn("[sync] compaction failed for", store, id, err)
      }
    }
  }
}
