import type { Change } from "@deck/contract"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import type { Card, Column, Dashboard } from "@/lib/types"
import { idb, META_STORE, type StoreName } from "./idb"
import { orpc } from "./orpc"

/**
 * Background sync between the local IndexedDB store and the server.
 *
 * The app is local-first: mutations land in IndexedDB instantly, and this job
 * reconciles with the backend on an interval instead of round-tripping on every
 * action. One `board.sync` call carries both directions of a tick:
 *
 *  - push: records changed locally (tracked per `store/key`) that belong to the
 *    open board are sent up; the server applies them last-writer-wins.
 *  - pull: every record the board has seen past our cursor comes back and is
 *    applied locally (also LWW) — this is what makes a board multi-user.
 *
 * Scope is the currently open board (see `setActiveBoard`). Syncing the whole
 * list of boards is a follow-up; until then, dashboard records sync only for the
 * open board itself (so renaming the open board still propagates).
 */

/**
 * How often to reconcile while the tab is visible. 10s keeps another user's
 * changes visibly fresh without flooding the server with empty polls; a hidden
 * tab doesn't poll at all (see `startBackgroundSync`), and we also reconcile
 * immediately on focus, which covers the "came back to a stale tab" case better
 * than any interval would.
 */
const DEFAULT_SYNC_INTERVAL = 10_000

/**
 * The poll interval, overridable at build time via `VITE_SYNC_INTERVAL_MS` so
 * the e2e bundle can tick fast (sub-second) and observe a remote change without
 * waiting out the 10s production cadence. Anything unset or invalid falls back
 * to the default.
 */
function syncInterval(): number {
  const ms = Number(import.meta.env.VITE_SYNC_INTERVAL_MS)
  return Number.isFinite(ms) && ms > 0 ? ms : DEFAULT_SYNC_INTERVAL
}

/** localStorage key under which the pending dirty refs are persisted. */
const DIRTY_KEY = "deck:sync:dirty"

/** meta-store key prefix for the per-board pull cursor (server seq). */
const CURSOR_PREFIX = "cursor:"

/** Reads the persisted dirty refs, tolerating missing/corrupt storage. */
function loadDirty(): Set<string> {
  try {
    const raw = localStorage.getItem(DIRTY_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

/** Persists the current dirty set so pending changes survive a reload. */
function saveDirty() {
  try {
    localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirty]))
  } catch {
    // Storage unavailable (private mode, quota); fall back to in-memory only.
  }
}

/**
 * Reads a board's last pull cursor; 0 means "pull everything" on first sync.
 * Lives in IndexedDB beside the data so clearing the local DB resets it too —
 * otherwise a stale cursor would hide every server change after a wipe.
 */
async function loadCursor(boardId: string): Promise<number> {
  const raw = await idb.get<number>(META_STORE, CURSOR_PREFIX + boardId)
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
}

/** Persists a board's cursor so a reload resumes the pull where it left off. */
async function saveCursor(boardId: string, value: number): Promise<void> {
  try {
    await idb.set(META_STORE, CURSOR_PREFIX + boardId, value)
  } catch {
    // Storage unavailable; the next sync re-pulls from the in-memory cursor.
  }
}

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
  saveDirty()
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
 * Soft-deleted records still resolve (we never hard-delete), so tombstones push.
 */
async function collectChanges(
  boardId: string
): Promise<{ changes: Change[]; refs: string[] }> {
  const changes: Change[] = []
  const refs: string[] = []

  for (const ref of dirty) {
    const slash = ref.indexOf("/")
    const store = ref.slice(0, slash) as StoreName
    const id = ref.slice(slash + 1)

    if (store === "dashboards") {
      if (id !== boardId) continue // other boards' metadata: follow-up
      const record = await idb.get<Dashboard>("dashboards", id)
      if (record) {
        changes.push({ store, record })
        refs.push(ref)
      }
    } else if (store === "columns") {
      const record = await idb.get<Column>("columns", id)
      if (record?.dashboardId === boardId) {
        changes.push({ store, record })
        refs.push(ref)
      }
    } else if (store === "cards") {
      const record = await idb.get<Card>("cards", id)
      if (!record) continue
      const column = await idb.get<Column>("columns", record.columnId)
      if (column?.dashboardId === boardId) {
        changes.push({ store, record })
        refs.push(ref)
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

    if (store === "cards") {
      touchedCards.push(record.id)
      touchedBoard = true
    } else if (store === "columns") {
      touchedBoard = true
    } else {
      touchedDashboards = true
    }
  }

  return { touchedCards, touchedBoard, touchedDashboards }
}

/**
 * Hard-deletes local tombstones that have already reached the server, reclaiming
 * IndexedDB space so deleted records don't accumulate forever.
 */
async function compactTombstones(
  candidates: Array<{ store: StoreName; id: string }>
): Promise<void> {
  for (const { store, id } of candidates) {
    if (dirty.has(`${store}/${id}`)) continue
    try {
      const record = await idb.get<{ deletedAt: number | null }>(store, id)
      if (record?.deletedAt != null) await idb.delete(store, id)
    } catch (err) {
      console.warn("[sync] compaction failed for", store, id, err)
    }
  }
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
    saveDirty()

    let result: { cursor: number; changes: Change[] }
    try {
      result = await orpc.board.sync({ boardId, since, changes })
    } catch (err) {
      for (const ref of refs) dirty.add(ref)
      saveDirty()
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

    await compactTombstones([
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

/**
 * Starts the periodic background sync. Reconciles every `SYNC_INTERVAL` while the
 * tab is visible, and once immediately whenever it becomes visible (covering the
 * stale-tab case). Returns a stop function that clears the timer and listener.
 */
export function startBackgroundSync(): () => void {
  let id: ReturnType<typeof setInterval> | undefined

  const start = () => {
    if (id === undefined)
      id = setInterval(() => void reconcile(), syncInterval())
  }
  const stop = () => {
    if (id !== undefined) {
      clearInterval(id)
      id = undefined
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void reconcile()
      start()
    } else {
      stop()
    }
  }

  document.addEventListener("visibilitychange", onVisibility)
  if (document.visibilityState === "visible") start()

  return () => {
    document.removeEventListener("visibilitychange", onVisibility)
    stop()
  }
}
