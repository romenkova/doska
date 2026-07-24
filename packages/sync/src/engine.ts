import { DirtyStore } from "./dirty"
import type { PushResult, SyncDriver } from "./driver"

/**
 * Where the engine is in its push/pull cycle. `paused` means the gate is shut
 * (signed out, no server configured) — nothing is syncing and nothing is
 * failing, which is a different thing from `idle`.
 */
export type SyncStatus = "idle" | "syncing" | "error" | "paused"

/** Why a reconcile failed, insofar as the transport can tell. */
export type SyncFailure = "offline" | "auth" | "server"

export interface SyncState {
  /** `syncing` while a reconcile is in flight; `error` if the last one failed. */
  readonly status: SyncStatus
  /** Refs changed locally but not yet acknowledged by the server. */
  readonly pending: number
  /**
   * Consecutive failed reconciles, reset by any success. A single flaky request
   * is 1; a real outage climbs, which is what tells the two apart.
   */
  readonly failures: number
  /** When a reconcile last succeeded (epoch ms); null if none has yet. */
  readonly lastSyncedAt: number | null
  /** Why the last reconcile failed; null while healthy. */
  readonly failure: SyncFailure | null
}

/** What one cycle learned, accumulated across its scopes. */
interface Attempt {
  /** Whether any scope actually got as far as talking to the server. */
  ran: boolean
  failed: boolean
  failure: SyncFailure | null
}

/** Transport-agnostic fallback: the browser knows when it's offline. */
const defaultClassify = (): SyncFailure =>
  typeof navigator !== "undefined" && navigator.onLine === false
    ? "offline"
    : "server"

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

  /** Scopes to pull once alongside the active one, then forget — see
   * {@link reconcileScopes}. */
  private readonly extraScopes = new Set<Scope>()

  private readonly driver: SyncDriver<Scope, Change>

  // Gate consulted before every reconcile.
  private readonly canSync: () => boolean

  // Turns a transport error into a reason the UI can act on.
  private readonly classify: (err: unknown) => SyncFailure

  /** What the in-flight cycle has learned so far; settled at the end of it. */
  private attempt: Attempt = { ran: false, failed: false, failure: null }

  private state: SyncState
  private readonly listeners = new Set<() => void>()

  constructor(
    driver: SyncDriver<Scope, Change>,
    options: {
      storageKey: string
      canSync?: () => boolean
      classify?: (err: unknown) => SyncFailure
    }
  ) {
    this.driver = driver
    this.dirty = new DirtyStore(options.storageKey)
    this.state = {
      status: "idle",
      pending: this.dirty.size,
      failures: 0,
      lastSyncedAt: null,
      failure: null,
    }
    this.canSync = options.canSync ?? (() => true)
    this.classify = options.classify ?? defaultClassify
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

  /**
   * Reconciles these scopes once, in addition to the active one, without making
   * any of them active. For a view that reads across scopes (deck's digest
   * spans every board) and so needs them all pulled, but is not "in" any of them.
   */
  reconcileScopes(scopes: Scope[]): Promise<void> {
    for (const scope of scopes) this.extraScopes.add(scope)
    return this.reconcile()
  }

  private async cycle(): Promise<void> {
    do {
      this.rerun = false
      this.attempt = { ran: false, failed: false, failure: null }
      await this.pass()
      this.settle()
    } while (this.rerun)
  }

  /**
   * Turns the cycle's outcome into the published state.
   */
  private settle() {
    const pending = this.dirty.size

    // The gate is shut: not syncing, but not broken either. Say so rather than
    // sitting on `idle`, which the UI reads as "everything is saved".
    if (!this.canSync()) {
      this.setState({ ...this.state, status: "paused", pending })
      return
    }

    // Nothing to sync (no active scope, nothing dirty) — no news either way, so
    // claim no fresh success, but drop any stale failure: this engine isn't the
    // one that's broken.
    if (!this.attempt.ran) {
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
    for (const scope of [...this.extraScopes]) add(scope)
    if (this.driver.pendingScopes)
      for (const scope of await this.driver.pendingScopes(this.dirty))
        add(scope)

    // A one-shot request is spent by the pass that runs it, even if that pass
    // fails — the caller asks again rather than the engine retrying forever. A
    // pass that never got to run it (the gate was shut, as on a cold start
    // before the session resolves) spends nothing.
    for (const scope of scopes) {
      if (await this.run(scope)) this.extraScopes.delete(scope)
    }
  }

  // Exclusivity is `cycle`'s job, so this only screens out unsyncable scopes.
  // The verdict is recorded on `attempt`; `settle` publishes it. Returns whether
  // the scope was actually attempted.
  private async run(scope: Scope | null): Promise<boolean> {
    if (scope === null || !this.canSync()) return false
    this.attempt.ran = true
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
        this.fail(err)
        return true
      }

      // Only once the server has them. Clearing before the push would strand
      // the refs if it never settles at all — which is what a mobile OS does to
      // a backgrounded app mid-fetch: no rejection, so no chance to put them
      // back, and the edit is lost.
      this.dirty.clearPushed(pushed)

      await this.driver.applyRemote(scope, result.changes)
      await this.driver.saveCursor(scope, result.cursor)

      await this.driver.compact(this.dirty, [
        ...refs,
        ...result.changes.map((c) => this.driver.refOf(c)),
      ])
    } catch (err) {
      this.fail(err)
    }
    return true
  }

  private fail(err: unknown) {
    this.attempt.failed = true
    this.attempt.failure = this.classify(err)
    console.warn("[sync] reconcile failed; will retry next tick", err)
  }
}
