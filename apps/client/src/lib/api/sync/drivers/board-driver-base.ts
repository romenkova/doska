import type { Change } from "@doska/contract"
import type {
  DirtyStore,
  PushInput,
  PushResult,
  SyncDriver,
} from "@doska/sync"
import * as board from "./board-channel"
import * as generic from "./channel-shared"

/**
 * Per-board channel wiring. Concrete drivers add only the cursor namespace
 * ({@link cursorPrefix}) and transport ({@link push}).
 */
export abstract class BoardDriverBase implements SyncDriver<string, Change> {
  protected abstract readonly cursorPrefix: string

  abstract push(input: PushInput<string, Change>): Promise<PushResult<Change>>

  loadCursor(boardId: string): Promise<number> {
    return generic.loadCursor(this.cursorPrefix + boardId)
  }

  saveCursor(boardId: string, value: number): Promise<void> {
    return generic.saveCursor(this.cursorPrefix + boardId, value)
  }

  collectChanges(boardId: string, dirty: DirtyStore) {
    return board.collectBoardChanges(boardId, dirty)
  }

  pendingScopes(dirty: DirtyStore): Promise<string[]> {
    return board.pendingBoardIds(dirty)
  }

  applyRemote(boardId: string, changes: Change[]): Promise<void> {
    return board.applyBoardRemote(boardId, changes)
  }

  refOf(change: Change): string {
    return generic.refOf(change)
  }

  compact(dirty: DirtyStore, refs: string[]): Promise<void> {
    return generic.compact(dirty, refs)
  }
}
