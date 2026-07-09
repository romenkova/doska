import type { Change } from "@doska/contract"
import type {
  DirtyStore,
  PushInput,
  PushResult,
  SyncDriver,
} from "@doska/sync"
import { orpc } from "../orpc"
import * as board from "./board-channel"
import * as generic from "./channel-shared"

const CURSOR_PREFIX = "cursor:"

/** Per-board sync against deck's server via oRPC's `board.sync`. */
export class DeckSyncDriver implements SyncDriver<string, Change> {
  push(input: PushInput<string, Change>): Promise<PushResult<Change>> {
    return orpc.board.sync({
      boardId: input.scope,
      since: input.since,
      changes: input.changes,
    })
  }

  loadCursor(boardId: string): Promise<number> {
    return generic.loadCursor(CURSOR_PREFIX + boardId)
  }

  saveCursor(boardId: string, value: number): Promise<void> {
    return generic.saveCursor(CURSOR_PREFIX + boardId, value)
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
