import { DirtyStore } from "./dirty"

/** A reconcile's push: the scope's local changes since its last cursor. */
export interface PushInput<Scope, Change> {
  scope: Scope
  since: number
  changes: Change[]
}

/** A push's reply: the new cursor plus everything pulled since `since`. */
export interface PushResult<Change> {
  cursor: number
  changes: Change[]
}

export interface SyncDriver<Scope, Change> {
  /** Reads a scope's last pull cursor; 0 means "pull everything". */
  loadCursor(scope: Scope): Promise<number>
  /** Persists a scope's cursor so a reload resumes where it left off. */
  saveCursor(scope: Scope, cursor: number): Promise<void>
  /**
   * Resolves the dirty refs belonging to `scope` into changes to push, plus the
   * refs consumed (so they can be restored if the push fails). Refs for other
   * scopes stay dirty.
   */
  collectChanges(
    scope: Scope,
    dirty: DirtyStore
  ): Promise<{ changes: Change[]; refs: string[] }>
  /**
   * The scopes that currently hold dirty changes, so the engine can flush every
   * one of them — not just the open scope — on a reconcile. Optional: a driver
   * whose whole channel is a single scope (it collects all its changes at once)
   * can omit it, and the engine falls back to the active scope.
   */
  pendingScopes?(dirty: DirtyStore): Promise<Scope[]>
  /** Pushes local changes and pulls everything since `since`. */
  push(input: PushInput<Scope, Change>): Promise<PushResult<Change>>
  /** Applies pulled changes to local storage. */
  applyRemote(scope: Scope, changes: Change[]): Promise<void>
  /** The dirty ref a pulled change would occupy, used to build compaction candidates. */
  refOf(change: Change): string
  /** Hard-deletes local tombstones that have already reached the server. */
  compact(dirty: DirtyStore, refs: string[]): Promise<void>
}
