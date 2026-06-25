import { DirtyStore } from "./dirty"
import type { SyncDriver } from "./driver"

/** Where the engine is in its push/pull cycle. */
export type SyncStatus = "idle" | "syncing" | "error"

/** A snapshot of sync progress, surfaced to the UI via {@link SyncEngine.subscribe}. */
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

  /** Guards against overlapping reconciles (a slow tick + a focus-triggered one). */
  private inFlight = false

  private readonly driver: SyncDriver<Scope, Change>

  /** Gate consulted before every reconcile;  */
  private readonly canSync: () => boolean

  /** The latest snapshot handed to subscribers; replaced (never mutated) on change. */
  private state: SyncState

  /** Subscribers notified after every state transition (e.g. React stores). */
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

  /**
   * Subscribes to state changes; returns an unsubscribe. Shaped for
   * `useSyncExternalStore`, so it's an arrow to stay reference-stable.
   */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** The current state snapshot, stable until the next transition. */
  getState = (): SyncState => this.state

  /** Replaces the snapshot and notifies subscribers, skipping no-op updates. */
  private setState(next: SyncState) {
    if (
      next.status === this.state.status &&
      next.pending === this.state.pending
    )
      return
    this.state = next
    for (const listener of this.listeners) listener()
  }

  /** Flags a ref as changed locally and awaiting sync. */
  mark(ref: string) {
    this.dirty.mark(ref)
    this.setState({ status: this.state.status, pending: this.dirty.size })
  }

  /**
   * Points sync at the open scope
   */
  setActiveScope(scope: Scope | null) {
    if (scope === this.activeScope) return
    const previous = this.activeScope
    this.activeScope = scope
    void (async () => {
      await this.run(previous)
      await this.run(scope)
    })()
  }

  /** Runs one full reconcile for the active scope, skipping if one is already running. */
  reconcile(): Promise<void> {
    return this.run(this.activeScope)
  }

  /** Pushes/pulls a single scope, skipping if one is already running or there's no scope. */
  private async run(scope: Scope | null): Promise<void> {
    if (this.inFlight || scope === null || !this.canSync()) return
    this.inFlight = true
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

      let result: { cursor: number; changes: Change[] }
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
      this.inFlight = false
      this.setState({
        status: failed ? "error" : "idle",
        pending: this.dirty.size,
      })
    }
  }
}
