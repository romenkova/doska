import { DirtyStore } from "./dirty"
import type { PushResult, SyncDriver } from "./driver"

/** Where the engine is in its push/pull cycle. */
export type SyncStatus = "idle" | "syncing" | "error"

export interface SyncState {
  /** `syncing` while a reconcile is in flight; `error` if the last one failed. */
  readonly status: SyncStatus
  /** Refs changed locally but not yet acknowledged by the server. */
  readonly pending: number
}

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

  /** The reconcile currently in flight, so overlapping callers join it. */
  private running: Promise<void> | null = null

  /** Set when a reconcile arrives mid-flight; the running one loops once more. */
  private rerun = false

  private readonly driver: SyncDriver<Scope, Change>

  // Gate consulted before every reconcile.
  private readonly canSync: () => boolean

  private state: SyncState
  private readonly listeners = new Set<() => void>()

  constructor(
    driver: SyncDriver<Scope, Change>,
    options: { storageKey: string; canSync?: () => boolean }
  ) {
    this.driver = driver
    this.dirty = new DirtyStore(options.storageKey)
    this.state = { status: "idle", pending: this.dirty.size }
    this.canSync = options.canSync ?? (() => true)
  }

  // Arrow to stay reference-stable for `useSyncExternalStore`.
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = (): SyncState => this.state

  // Skips no-op updates.
  private setState(next: SyncState) {
    if (
      next.status === this.state.status &&
      next.pending === this.state.pending
    )
      return
    this.state = next
    for (const listener of this.listeners) listener()
  }

  mark(ref: string) {
    this.dirty.mark(ref)
    this.setState({ status: this.state.status, pending: this.dirty.size })
  }

  /**
   * Points the engine at a newly opened scope and pulls it. The scope being left
   * needs no explicit flush: its dirty refs surface through
   * {@link SyncDriver.pendingScopes} on the very same reconcile.
   */
  setActiveScope(scope: Scope | null) {
    if (scope === this.activeScope) return
    this.activeScope = scope
    void this.reconcile()
  }

  /**
   * Runs a full reconcile for the active scope **and every scope that has dirty
   * changes** — so local edits sync no matter which scope is open (e.g. a board
   * edited then navigated away from).
   */
  reconcile(): Promise<void> {
    if (this.running) {
      this.rerun = true
      return this.running
    }
    this.running = this.cycle().finally(() => {
      this.running = null
    })
    return this.running
  }

  private async cycle(): Promise<void> {
    do {
      this.rerun = false
      await this.pass()
    } while (this.rerun)
  }

  /**
   * One sweep over the scopes worth syncing.
   *
   * Cost: `pendingScopes` plus each scope's `collectChanges` re-scan the dirty
   * queue, so a pass touches it O(scopes) times — fine while the queue is
   * small (typical), worth revisiting if it grows large.
   */
  private async pass(): Promise<void> {
    const scopes: Scope[] = []
    const seen = new Set<Scope>()
    const add = (scope: Scope | null) => {
      if (scope === null || seen.has(scope)) return
      seen.add(scope)
      scopes.push(scope)
    }

    add(this.activeScope)
    if (this.driver.pendingScopes)
      for (const scope of await this.driver.pendingScopes(this.dirty))
        add(scope)

    for (const scope of scopes) await this.run(scope)
  }

  // Exclusivity is `cycle`'s job, so this only screens out unsyncable scopes.
  private async run(scope: Scope | null): Promise<void> {
    if (scope === null || !this.canSync()) return
    this.setState({ status: "syncing", pending: this.dirty.size })
    let failed = false
    try {
      const since = await this.driver.loadCursor(scope)
      const { changes, refs } = await this.driver.collectChanges(
        scope,
        this.dirty
      )
      // Optimistically clear the refs we're pushing; restore them on failure.
      this.dirty.clear(refs)

      let result: PushResult<Change>
      try {
        result = await this.driver.push({ scope, since, changes })
      } catch (err) {
        this.dirty.restore(refs)
        console.warn("[sync] reconcile failed; will retry next tick", err)
        failed = true
        return
      }

      await this.driver.applyRemote(scope, result.changes)
      await this.driver.saveCursor(scope, result.cursor)

      await this.driver.compact(this.dirty, [
        ...refs,
        ...result.changes.map((c) => this.driver.refOf(c)),
      ])
    } catch (err) {
      failed = true
      throw err
    } finally {
      this.setState({
        status: failed ? "error" : "idle",
        pending: this.dirty.size,
      })
    }
  }
}
