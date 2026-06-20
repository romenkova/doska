import { idb, META_STORE } from "../db/idb"
import { CURSOR_PREFIX } from "./constants"

/**
 * Reads a board's last pull cursor; 0 means "pull everything" on first sync.
 * Lives in IndexedDB beside the data so clearing the local DB resets it too —
 * otherwise a stale cursor would hide every server change after a wipe.
 */
export async function loadCursor(boardId: string): Promise<number> {
  const raw = await idb.get<number>(META_STORE, CURSOR_PREFIX + boardId)
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
}

/** Persists a board's cursor so a reload resumes the pull where it left off. */
export async function saveCursor(
  boardId: string,
  value: number
): Promise<void> {
  try {
    await idb.set(META_STORE, CURSOR_PREFIX + boardId, value)
  } catch {
    // Storage unavailable; the next sync re-pulls from the in-memory cursor.
  }
}
