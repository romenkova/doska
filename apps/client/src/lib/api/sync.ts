import type { StoreName } from "./idb"

/**
 * Background sync between the local IndexedDB store and the server.
 *
 * The app is local-first: mutations land in IndexedDB instantly, and this job
 * reconciles with the backend on an interval instead of round-tripping on every
 * action. Two directions ride the same tick:
 *
 *  - push: changed records (tracked per `store/key`) are sent to the server.
 *  - pull: changes made by *other* users on the same board are fetched since the
 *    last cursor and applied locally — this is what makes a board multi-user.
 *
 * There's no backend yet, so `pushToServer`/`pullFromServer` are stubbed: push
 * logs the pending records, pull is a no-op. The shape (cursor, dirty refs) is
 * what a real sync needs, so wiring the fetch in later is a drop-in.
 */

/**
 * How often to reconcile while the tab is visible. 10s keeps another user's
 * changes visibly fresh without flooding the server with empty polls; a hidden
 * tab doesn't poll at all (see `startBackgroundSync`), and we also reconcile
 * immediately on focus, which covers the "came back to a stale tab" case better
 * than any interval would.
 */
const SYNC_INTERVAL = 10_000

/** localStorage key under which the pending dirty refs are persisted. */
const DIRTY_KEY = "deck:sync:dirty"

/** localStorage key under which the last pull cursor (server seq) is persisted. */
const CURSOR_KEY = "deck:sync:cursor"

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

/** Reads the last pull cursor; 0 means "pull everything" on first sync. */
function loadCursor(): number {
  const raw = Number(localStorage.getItem(CURSOR_KEY))
  return Number.isFinite(raw) ? raw : 0
}

/** Persists the cursor so a reload resumes the pull where it left off. */
function saveCursor(value: number) {
  try {
    localStorage.setItem(CURSOR_KEY, String(value))
  } catch {
    // Storage unavailable; the next sync re-pulls from the in-memory cursor.
  }
}

/**
 * Records changed locally but not yet pushed, as `store/key` refs. Hydrated
 * from localStorage so a reload doesn't drop changes that haven't synced yet.
 */
const dirty = loadDirty()

/** Server high-water mark we've pulled up to; advanced after each pull. */
const cursor = loadCursor()

/** Guards against overlapping reconciles (a slow tick + a focus-triggered one). */
let inFlight = false

/** Flags a record as changed locally and awaiting sync. */
export function markDirty(store: StoreName, key: string) {
  dirty.add(`${store}/${key}`)
  saveDirty()
}

/** Pushes pending local changes to the server. Stubbed: logs instead of POSTing. */
async function pushToServer(): Promise<void> {
  if (dirty.size === 0) return
  const pushing = [...dirty]
  dirty.clear()
  saveDirty()

  // TODO: resolve each `store/key` ref to its current record and POST them, e.g.
  //   await fetch("/board/:id/sync", { method: "POST", body: ... })
  // On failure, re-add `pushing` to `dirty` (then `saveDirty()`) so the next
  // tick retries.
  console.info(
    `[sync] would push ${pushing.length} change(s) to server`,
    pushing
  )
}

/**
 * Pulls changes made by other users since `cursor` and applies them locally.
 * Stubbed: a real version would
 *   - GET /board/:id/sync?since=<cursor>
 *   - upsert/tombstone each returned record into IndexedDB by last-writer-wins
 *   - invalidate the affected react-query keys so the UI refreshes
 *   - advance `cursor` to the server's high-water mark
 */
async function pullFromServer(): Promise<void> {
  // TODO: fetch + apply remote changes; for now the cursor never advances.
  void cursor
  void saveCursor
}

/** Runs one full reconcile (push then pull), skipping if one is already running. */
export async function reconcile(): Promise<void> {
  if (inFlight) return
  inFlight = true
  try {
    await pushToServer()
    await pullFromServer()
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
      id = setInterval(() => void reconcile(), SYNC_INTERVAL)
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
