import type { KeyValue } from "@doska/ports"
import { DirtyStore } from "./dirty"
import type { PushResult, SyncDriver } from "./driver"

/** `paused` is the gate being shut (signed out, no server) — not `idle`. */
export type SyncStatus = "idle" | "syncing" | "error" | "paused"

/**
 * `forbidden` is about the scope, not the session: the server refuses this one
 * scope while the sign-in is perfectly good. It never reaches {@link SyncState}
 * — the engine drops the scope instead of failing the cycle.
 */
export type SyncFailure = "offline" | "auth" | "server" | "forbidden"

export interface SyncState {
  readonly status: SyncStatus
  /** Refs changed locally but not yet acknowledged by the server. */
  readonly pending: number
  /** Consecutive failures, reset by any success: tells a flake from an outage. */
  readonly failures: number
  readonly lastSyncedAt: number | null
  readonly failure: SyncFailure | null
}

/** What one cycle learned, accumulated across its scopes. */
interface Attempt {
  /** Scopes actually synced; a refused scope subtracts itself back out, since
   * being turned away is neither a success nor a failure to report. */
  attempted: number
  failed: boolean
  failure: SyncFailure | null
}

/** Without a `classify` there is nothing to tell a dead network from a broken
 * server, and "server" is the one that keeps retrying. */
const defaultClassify = (): SyncFailure => "server"

/**
 * Drives reconciliation between a local store and a server: push the dirty refs
 * for the active scope, pull everything since the cursor, apply it. The engine
 * owns the mutable state; the {@link SyncDriver} supplies the domain steps.
 */
export class SyncEngine<Scope, Change> {
  readonly dirty: DirtyStore

  private activeScope: Scope | null = null

  /** The reconcile in flight, so overlapping callers join it. */
  private running: Promise<void> | null = null

  /** Set when a reconcile arrives mid-flight; the running one loops once more. */
  private rerun = false

  /** Pulled once alongside the active scope, then forgotten. */
  private readonly extraScopes = new Set<Scope>()

  /** Pulled on every pass alongside the active scope. */
  private watchedScopes: Scope[] = []

  private readonly driver: SyncDriver<Scope, Change>
  private readonly canSync: () => boolean
  private readonly classify: (err: unknown) => SyncFailure
  private readonly onForbidden: (scope: Scope) => Promise<void> | void

  private attempt: Attempt = { attempted: 0, failed: false, failure: null }

  private state: SyncState
  private readonly listeners = new Set<() => void>()

  constructor(
    driver: SyncDriver<Scope, Change>,
    options: {
      kv: KeyValue
      storageKey: string
      canSync?: () => boolean
      classify?: (err: unknown) => SyncFailure
      /** Runs once per scope the server refuses, after the engine drops it. */
      onForbidden?: (scope: Scope) => Promise<void> | void
    }
  ) {
    this.driver = driver
    this.dirty = new DirtyStore(options.kv, options.storageKey)
    this.state = {
      status: "idle",
      pending: this.dirty.size,
      failures: 0,
      lastSyncedAt: null,
      failure: null,
    }
    this.canSync = options.canSync ?? (() => true)
    this.classify = options.classify ?? defaultClassify
    this.onForbidden = options.onForbidden ?? (() => {})
  }

  // Arrow to stay reference-stable for `useSyncExternalStore`.
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = (): SyncState => this.state

  private setState(next: SyncState) {
    const prev = this.state
    if (
      next.status === prev.status &&
      next.pending === prev.pending &&
      next.failures === prev.failures &&
      next.lastSyncedAt === prev.lastSyncedAt &&
      next.failure === prev.failure
    )
      return
    this.state = next
    for (const listener of this.listeners) listener()
  }

  mark(ref: string) {
    this.dirty.mark(ref)
    this.setState({ ...this.state, pending: this.dirty.size })
  }

  /** Abandons every pending ref unpushed — see {@link DirtyStore.clear}. */
  clearDirty() {
    this.dirty.clear()
    this.setState({ ...this.state, pending: 0 })
  }

  /**
   * Abandons specific refs unpushed. For records that can no longer reach the
   * server at all: left dirty they retry forever and `pending` never settles.
   */
  dropDirty(refs: string[]) {
    this.dirty.drop(refs)
    this.setState({ ...this.state, pending: this.dirty.size })
  }

  /**
   * Forgets everything that belonged to the previous identity
   */
  reset() {
    this.activeScope = null
    this.watchedScopes = []
    this.extraScopes.clear()
    this.dirty.clear()
    this.setState({
      status: "idle",
      pending: 0,
      failures: 0,
      lastSyncedAt: null,
      failure: null,
    })
  }

  /**
   * Points the engine at a newly opened scope and pulls it. The scope being left
   * needs no flush: its dirty refs surface through
   * {@link SyncDriver.pendingScopes} on the very same reconcile.
   */
  setActiveScope(scope: Scope | null) {
    if (scope === this.activeScope) return
    this.activeScope = scope
    void this.reconcile()
  }

  /** Reconciles the active scope and every scope holding dirty changes. */
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

  /** Pulls these scopes once more, without making any of them active. */
  reconcileScopes(scopes: Scope[]): Promise<void> {
    for (const scope of scopes) this.extraScopes.add(scope)
    return this.reconcile()
  }

  /**
   * Pulls these scopes on every pass. {@link reconcileScopes} pulls once, which
   * leaves a cross-scope view stale the moment it has loaded. `[]` stops.
   */
  watchScopes(scopes: Scope[]) {
    this.watchedScopes = [...scopes]
  }

  /** Stops pulling a scope that is no longer ours to sync. Idempotent. */
  dropScope(scope: Scope) {
    if (scope === this.activeScope) this.activeScope = null
    this.watchedScopes = this.watchedScopes.filter((s) => s !== scope)
    this.extraScopes.delete(scope)
  }

  private async cycle(): Promise<void> {
    do {
      this.rerun = false
      this.attempt = { attempted: 0, failed: false, failure: null }
      await this.pass()
      this.settle()
    } while (this.rerun)
  }

  private settle() {
    const pending = this.dirty.size

    if (!this.canSync()) {
      this.setState({ ...this.state, status: "paused", pending })
      return
    }

    // Nothing to sync: no news either way, so claim no fresh success but drop
    // any stale failure — this engine isn't the one that's broken.
    if (this.attempt.attempted === 0) {
      this.setState({
        ...this.state,
        status: "idle",
        pending,
        failures: 0,
        failure: null,
      })
      return
    }

    if (this.attempt.failed) {
      this.setState({
        status: "error",
        pending,
        failures: this.state.failures + 1,
        lastSyncedAt: this.state.lastSyncedAt,
        failure: this.attempt.failure,
      })
      return
    }

    this.setState({
      status: "idle",
      pending,
      failures: 0,
      lastSyncedAt: Date.now(),
      failure: null,
    })
  }

  /** One sweep over the scopes worth syncing. */
  private async pass(): Promise<void> {
    const scopes: Scope[] = []
    const seen = new Set<Scope>()
    const add = (scope: Scope | null) => {
      if (scope === null || seen.has(scope)) return
      seen.add(scope)
      scopes.push(scope)
    }

    add(this.activeScope)
    for (const scope of this.watchedScopes) add(scope)
    for (const scope of [...this.extraScopes]) add(scope)
    if (this.driver.pendingScopes)
      for (const scope of await this.driver.pendingScopes(this.dirty))
        add(scope)

    // A one-shot request is spent by the pass that runs it even if that pass
    // fails; a pass that never got to run it (gate shut) spends nothing.
    for (const scope of scopes) {
      if (await this.run(scope)) this.extraScopes.delete(scope)
    }
  }

  /** Returns whether the scope was actually attempted. */
  private async run(scope: Scope | null): Promise<boolean> {
    if (scope === null || !this.canSync()) return false
    this.attempt.attempted += 1
    // A pull with nothing to push stays quiet: every background tick would
    // otherwise read as "syncing".
    if (this.dirty.size > 0)
      this.setState({
        ...this.state,
        status: "syncing",
        pending: this.dirty.size,
      })
    try {
      const since = await this.driver.loadCursor(scope)
      const { changes, refs } = await this.driver.collectChanges(
        scope,
        this.dirty
      )
      const pushed = this.dirty.marksFor(refs)

      let result: PushResult<Change>
      try {
        result = await this.driver.push({ scope, since, changes })
      } catch (err) {
        await this.fail(scope, err)
        return true
      }

      // Only once the server has them. Clearing before the push strands the refs
      // if it never settles at all — which is what a mobile OS does to a
      // backgrounded app mid-fetch: no rejection, so no chance to put them back.
      this.dirty.clearPushed(pushed)

      await this.driver.applyRemote(scope, result.changes)

      if (result.removed?.length)
        await this.driver.applyRemoved?.(result.removed)
      await this.driver.saveCursor(scope, result.cursor)

      await this.driver.compact(this.dirty, [
        ...refs,
        ...result.changes.map((c) => this.driver.refOf(c)),
      ])
    } catch (err) {
      await this.fail(scope, err)
    }
    return true
  }

  private async fail(scope: Scope, err: unknown) {
    const failure = this.classify(err)
    if (failure === "forbidden") {
      await this.forbid(scope)
      return
    }
    this.attempt.failed = true
    this.attempt.failure = failure
    console.warn("[sync] reconcile failed; will retry next tick", err)
  }

  /**
   * Stops syncing a scope the server refuses. Retrying it is pointless — access
   * doesn't come back on its own — and counting it as a failure would report the
   * whole connection as down over one scope.
   */
  private async forbid(scope: Scope) {
    this.attempt.attempted -= 1
    this.dropScope(scope)
    console.warn("[sync] scope refused by the server; dropping it", scope)
    try {
      await this.onForbidden(scope)
    } catch (err) {
      console.warn("[sync] dropping the refused scope failed", err)
    }
  }
}
