import type { StoreName } from "../constants"

/** localStorage key under which the pending dirty refs are persisted. */
const DIRTY_KEY = "deck:sync:dirty"

/** Reads the persisted dirty refs, tolerating missing/corrupt storage. */
function load(): Set<string> {
  try {
    const raw = localStorage.getItem(DIRTY_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

/**
 * Tracks records changed locally but not yet pushed, as `store/key` refs.
 */
export class DirtyStore {
  private readonly refs = load()

  private save() {
    try {
      localStorage.setItem(DIRTY_KEY, JSON.stringify([...this.refs]))
    } catch {
      // Storage unavailable (private mode, quota); fall back to in-memory only.
    }
  }

  /** Flags a record as changed locally and awaiting sync. */
  mark(store: StoreName, key: string) {
    this.refs.add(`${store}/${key}`)
    this.save()
  }

  /** The current dirty refs, for resolving into a push. */
  all(): Iterable<string> {
    return this.refs
  }

  /** True if `store/id` is still pending a push (so it must not be compacted). */
  has(store: StoreName, id: string): boolean {
    return this.refs.has(`${store}/${id}`)
  }

  /** Drops refs we've optimistically pushed. */
  clear(consumed: string[]) {
    for (const ref of consumed) this.refs.delete(ref)
    this.save()
  }

  /** Restores refs whose push failed, so they retry next tick. */
  restore(consumed: string[]) {
    for (const ref of consumed) this.refs.add(ref)
    this.save()
  }
}
