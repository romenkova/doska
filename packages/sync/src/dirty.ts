/** Reads the persisted dirty refs, tolerating missing/corrupt storage. */
function load(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

/**
 * Tracks records changed locally but not yet pushed, as opaque string refs.
 * The ref format (e.g. `store/key`) is the caller's concern; the store treats
 * them as plain keys and persists them to `localStorage` under `storageKey`.
 */
export class DirtyStore {
  private readonly refs: Set<string>
  private readonly storageKey: string

  constructor(storageKey: string) {
    this.storageKey = storageKey
    this.refs = load(storageKey)
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.refs]))
    } catch {
      // Storage unavailable (private mode, quota); fall back to in-memory only.
    }
  }

  /** Flags a ref as changed locally and awaiting sync. */
  mark(ref: string) {
    this.refs.add(ref)
    this.save()
  }

  /** The current dirty refs, for resolving into a push. */
  all(): Iterable<string> {
    return this.refs
  }

  /** How many refs are still awaiting a push; drives the "unsaved" indicator. */
  get size(): number {
    return this.refs.size
  }

  /** True if `ref` is still pending a push (so it must not be compacted). */
  has(ref: string): boolean {
    return this.refs.has(ref)
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
