import type { Change } from "@doska/contract"
import type { PushInput } from "@doska/sync"
import { orpc } from "../orpc"
import { BoardDriverBase } from "./board-driver-base"

/** Per-board sync against deck's server via oRPC's `board.sync`. */
export class DeckSyncDriver extends BoardDriverBase {
  protected readonly cursorPrefix = "cursor:"

  push(input: PushInput<string, Change>) {
    return orpc.board.sync({
      boardId: input.scope,
      since: input.since,
      changes: input.changes,
    })
  }
}
