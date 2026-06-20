import type { Change } from "@deck/contract"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import type { Card, Column, Dashboard } from "@/lib/types"
import { idb } from "../db/idb"
import { orpc } from "./orpc"
import { CARDS, COLUMNS, DASHBOARDS, type StoreName } from "../constants"
import { cleanupDeleted } from "./cleanup-deleted"
import { loadDirty, saveDirty } from "./dirty"
import { loadCursor, saveCursor } from "./cursor"

/**
 * Background sync between the local IndexedDB store and the server.
 */

/**
 * Records changed locally but not yet pushed, as `store/key` refs. Hydrated
 * from localStorage so a reload doesn't drop changes that haven't synced yet.
 */
const dirty = loadDirty()

/** The board we sync; set by the UI when the open board changes. */
let activeBoard: string | null = null

/** Guards against overlapping reconciles (a slow tick + a focus-triggered one). */
let inFlight = false

/** Flags a record as changed locally and awaiting sync. */
export function markDirty(store: StoreName, key: string) {
  dirty.add(`${store}/${key}`)
  saveDirty(dirty)
}

/** Points sync at the open board and reconciles it immediately. */
export function setActiveBoard(boardId: string | null) {
  if (boardId === activeBoard) return
  activeBoard = boardId
  void reconcile()
}

/**
 * Resolves the dirty refs that belong to `boardId` into a `Change[]` to push,
 * alongside the refs consumed (so they can be restored if the push fails).
 * Refs for other boards stay dirty and push when their board is active.
 * Soft-deleted records still resolve (we never hard-delete), so tombstones push.
 */
async function collectChanges(boardId: string): Promise<{
  changes: Change[]
  refs: string[]
}> {
  const changes: Change[] = []
  const refs: string[] = []

  for (const ref of dirty) {
    const [store, id] = ref.split("/")

    switch (store) {
      case DASHBOARDS: {
        const record = await idb.get<Dashboard>(DASHBOARDS, id)
        // The dashboard *is* the board, so its id is the boardId.
        if (record && record.id === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
      case COLUMNS: {
        const record = await idb.get<Column>(COLUMNS, id)
        if (record && record.dashboardId === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
      case CARDS: {
        const record = await idb.get<Card>(CARDS, id)
        if (!record) continue
        const column = await idb.get<Column>(COLUMNS, record.columnId)
        if (column && column.dashboardId === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
    }
  }

  return { changes, refs }
}

/** Applies pulled changes to IndexedDB under last-writer-wins. */
async function applyRemote(changes: Change[]) {
  const touchedCards: string[] = []
  let touchedBoard = false
  let touchedDashboards = false

  for (const { store, record } of changes) {
    const existing = await idb.get<{ updatedAt: number }>(store, record.id)
    if (existing && existing.updatedAt >= record.updatedAt) continue
    await idb.set(store, record.id, record)

    if (store === CARDS) {
      touchedCards.push(record.id)
      touchedBoard = true
    } else if (store === COLUMNS) {
      touchedBoard = true
    } else {
      touchedDashboards = true
    }
  }

  return { touchedCards, touchedBoard, touchedDashboards }
}

/** Runs one full reconcile for the open board, skipping if one is already running. */
export async function reconcile(): Promise<void> {
  if (inFlight || !activeBoard) return
  inFlight = true
  const boardId = activeBoard
  try {
    const since = await loadCursor(boardId)
    const { changes, refs } = await collectChanges(boardId)
    // Optimistically clear the refs we're pushing; restore them on failure.
    for (const ref of refs) dirty.delete(ref)
    saveDirty(dirty)

    let result: { cursor: number; changes: Change[] }
    try {
      result = await orpc.board.sync({ boardId, since, changes })
    } catch (err) {
      for (const ref of refs) dirty.add(ref)
      saveDirty(dirty)
      console.warn("[sync] reconcile failed; will retry next tick", err)
      return
    }

    const { touchedCards, touchedBoard, touchedDashboards } = await applyRemote(
      result.changes
    )
    await saveCursor(boardId, result.cursor)

    if (touchedDashboards)
      queryClient.invalidateQueries({ queryKey: keys.dashboards })
    if (touchedBoard)
      queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
    for (const id of touchedCards)
      queryClient.invalidateQueries({ queryKey: keys.card(id) })

    await cleanupDeleted(dirty, [
      ...refs.map((ref) => {
        const slash = ref.indexOf("/")
        return {
          store: ref.slice(0, slash) as StoreName,
          id: ref.slice(slash + 1),
        }
      }),
      ...result.changes.map((c) => ({ store: c.store, id: c.record.id })),
    ])
  } finally {
    inFlight = false
  }
}
