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
  /**
   * Ref → the sequence number of the `mark` that last dirtied it. The sequence
   * is what lets {@link clearPushed} tell "the server has this" apart from "the
   * user edited it again while the push was in flight".
   *
   * In-memory only: the persisted form stays a plain ref array. A reload starts
   * every loaded ref at 0 and `seq` at 0, so any mark after a reload outranks
   * them, which is the comparison that matters.
   */
  private readonly refs = new Map<string, number>()
  private readonly storageKey: string
  private seq = 0

  constructor(storageKey: string) {
    this.storageKey = storageKey
    for (const ref of load(storageKey)) this.refs.set(ref, 0)
  }

  private save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify([...this.refs.keys()])
      )
    } catch {
      // Storage unavailable (private mode, quota); fall back to in-memory only.
    }
  }

  /** Flags a ref as changed locally and awaiting sync. */
  mark(ref: string) {
    this.seq += 1
    this.refs.set(ref, this.seq)
    this.save()
  }

  /** The current dirty refs, for resolving into a push. */
  all(): Iterable<string> {
    return this.refs.keys()
  }

  /** How many refs are still awaiting a push; drives the "unsaved" indicator. */
  get size(): number {
    return this.refs.size
  }

  /** True if `ref` is still pending a push (so it must not be compacted). */
  has(ref: string): boolean {
    return this.refs.has(ref)
  }

  /**
   * Snapshots the marks behind `refs`, to hand back to {@link clearPushed} once
   * the push they went into has been acknowledged.
   */
  marksFor(refs: string[]): Map<string, number> {
    const marks = new Map<string, number>()
    for (const ref of refs) {
      const mark = this.refs.get(ref)
      if (mark !== undefined) marks.set(ref, mark)
    }
    return marks
  }

  /**
   * Drops the refs the server has acknowledged, keeping any that were marked
   * again after `marks` was taken — those carry an edit the push didn't include.
   */
  clearPushed(marks: Map<string, number>) {
    for (const [ref, mark] of marks) {
      if (this.refs.get(ref) === mark) this.refs.delete(ref)
    }
    this.save()
  }

  /** Removes refs outright, for ones that turned out to be unsyncable. */
  drop(refs: string[]) {
    for (const ref of refs) this.refs.delete(ref)
    this.save()
  }
}
