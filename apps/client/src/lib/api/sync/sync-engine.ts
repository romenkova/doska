import type { Change } from "@deck/contract"
import type { StoreName } from "../constants"
import { orpc } from "./orpc"
import { applyRemote } from "./apply-remote"
import { cleanupDeleted } from "./cleanup-deleted"
import { collectChanges } from "./collect-changes"
import { DirtyStore } from "./dirty"
import { loadCursor, saveCursor } from "./cursor"

/**
 * Background sync between the local IndexedDB store and the server: push the
 * dirty refs for the open board, pull everything since our cursor, apply it.
 *
 * One engine per app — there's a single open board and a single dirty queue —
 * so it's a singleton; `sync` below is the shared instance. All mutable state
 * (dirty refs, the active board, the in-flight guard) is private to it.
 */
class SyncEngine {
  private readonly dirty = new DirtyStore()

  /** The board we sync; set by the UI when the open board changes. */
  private activeBoard: string | null = null

  /** Guards against overlapping reconciles (a slow tick + a focus-triggered one). */
  private inFlight = false

  /** Flags a record as changed locally and awaiting sync. */
  markDirty(store: StoreName, key: string) {
    this.dirty.mark(store, key)
  }

  /** Points sync at the open board and reconciles it immediately. */
  setActiveBoard(boardId: string | null) {
    if (boardId === this.activeBoard) return
    this.activeBoard = boardId
    void this.reconcile()
  }

  /** Runs one full reconcile for the open board, skipping if one is already running. */
  async reconcile(): Promise<void> {
    if (this.inFlight || !this.activeBoard) return
    this.inFlight = true
    const boardId = this.activeBoard
    try {
      const since = await loadCursor(boardId)
      const { changes, refs } = await collectChanges(boardId, this.dirty)
      // Optimistically clear the refs we're pushing; restore them on failure.
      this.dirty.clear(refs)

      let result: { cursor: number; changes: Change[] }
      try {
        result = await orpc.board.sync({ boardId, since, changes })
      } catch (err) {
        this.dirty.restore(refs)
        console.warn("[sync] reconcile failed; will retry next tick", err)
        return
      }

      await applyRemote(boardId, result.changes)
      await saveCursor(boardId, result.cursor)

      await cleanupDeleted(this.dirty, [
        ...refs.map((ref) => {
          const [store, id] = ref.split("/")
          return {
            store: store as StoreName,
            id,
          }
        }),
        ...result.changes.map((c) => ({ store: c.store, id: c.record.id })),
      ])
    } finally {
      this.inFlight = false
    }
  }
}

/** The one engine the app drives. */
export const sync = new SyncEngine()
