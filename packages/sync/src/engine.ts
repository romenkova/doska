import { DirtyStore } from "./dirty"
import type { SyncDriver } from "./driver"

/**
 * Drives reconciliation between a local store and a server: push the dirty refs
 * for the active scope, pull everything since the cursor, apply it. The engine
 * owns all mutable state (the dirty queue, the active scope, the in-flight
 * guard); the {@link SyncDriver} supplies the domain-specific steps.
 *
 * Typically one engine per app (a single active scope and dirty queue), so it
 * is used as a singleton.
 */
export class SyncEngine<Scope, Change> {
  readonly dirty: DirtyStore

  /** The scope we sync; set by the caller when the open scope changes. */
  private activeScope: Scope | null = null

  /** Guards against overlapping reconciles (a slow tick + a focus-triggered one). */
  private inFlight = false

  private readonly driver: SyncDriver<Scope, Change>

  constructor(
    driver: SyncDriver<Scope, Change>,
    options: { storageKey: string }
  ) {
    this.driver = driver
    this.dirty = new DirtyStore(options.storageKey)
  }

  /** Flags a ref as changed locally and awaiting sync. */
  mark(ref: string) {
    this.dirty.mark(ref)
  }

  /** Points sync at the open scope and reconciles it immediately. */
  setActiveScope(scope: Scope | null) {
    if (scope === this.activeScope) return
    this.activeScope = scope
    void this.reconcile()
  }

  /** Runs one full reconcile for the active scope, skipping if one is already running. */
  async reconcile(): Promise<void> {
    if (this.inFlight || this.activeScope === null) return
    this.inFlight = true
    const scope = this.activeScope
    try {
      const since = await this.driver.loadCursor(scope)
      const { changes, refs } = await this.driver.collectChanges(
        scope,
        this.dirty
      )
      // Optimistically clear the refs we're pushing; restore them on failure.
      this.dirty.clear(refs)

      let result: { cursor: number; changes: Change[] }
      try {
        result = await this.driver.push({ scope, since, changes })
      } catch (err) {
        this.dirty.restore(refs)
        console.warn("[sync] reconcile failed; will retry next tick", err)
        return
      }

      await this.driver.applyRemote(scope, result.changes)
      await this.driver.saveCursor(scope, result.cursor)

      await this.driver.compact(this.dirty, [
        ...refs,
        ...result.changes.map((c) => this.driver.refOf(c)),
      ])
    } finally {
      this.inFlight = false
    }
  }
}
