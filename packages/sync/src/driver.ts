import { DirtyStore } from "./dirty"

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
  /** Pushes local changes and pulls everything since `since`. */
  push(input: {
    scope: Scope
    since: number
    changes: Change[]
  }): Promise<{ cursor: number; changes: Change[] }>
  /** Applies pulled changes to local storage. */
  applyRemote(scope: Scope, changes: Change[]): Promise<void>
  /** The dirty ref a pulled change would occupy, used to build compaction candidates. */
  refOf(change: Change): string
  /** Hard-deletes local tombstones that have already reached the server. */
  compact(dirty: DirtyStore, refs: string[]): Promise<void>
}
