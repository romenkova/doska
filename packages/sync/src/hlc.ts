/**
 * Hybrid logical clock for LWW timestamps. `updatedAt` stays a plain
 * millisecond number, but is guaranteed to advance past every timestamp this
 * device has seen — local or pulled — so an edit made after observing a remote
 * change always wins LWW over it, even if the device clock is behind.
 * Degrades to plain wall-clock time whenever the device clock is ahead of
 * everything seen so far.
 */
export class HybridClock {
  private lastSeen = 0

  /**
   * Fold in a timestamp observed from elsewhere: a pulled record, or the
   * persisted high-water mark on startup. Never moves the clock backwards.
   */
  receive(ts: number): void {
    if (Number.isFinite(ts) && ts > this.lastSeen) this.lastSeen = ts
  }

  /** Timestamp for a local mutation: wall clock, but strictly after `last`. */
  now(): number {
    this.lastSeen = Math.max(Date.now(), this.lastSeen + 1)
    return this.lastSeen
  }

  /** High-water mark, for persisting across reloads. */
  get last(): number {
    return this.lastSeen
  }
}
