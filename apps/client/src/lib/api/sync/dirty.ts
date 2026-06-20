import { DIRTY_KEY } from "./constants"

/** Reads the persisted dirty refs, tolerating missing/corrupt storage. */
export function loadDirty(): Set<string> {
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
export function saveDirty(dirty: Set<string>) {
  try {
    localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirty]))
  } catch {
    // Storage unavailable (private mode, quota); fall back to in-memory only.
  }
}
