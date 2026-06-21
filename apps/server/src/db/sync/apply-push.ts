import type { Change } from "@deck/contract"
import { applyChanges } from "./apply-changes"
import { applyOne } from "./apply-one"
import { boardCounter } from "./counter"

/**
 * Applies a client's pushed board changes under last-writer-wins, bumping the
 * board's counter once per accepted write.
 */
export function applyPush(boardId: string, changes: Change[]): Promise<void> {
  return applyChanges(boardCounter(boardId), changes, (tx, change, nextSeq) =>
    applyOne(tx, boardId, change, nextSeq)
  )
}
