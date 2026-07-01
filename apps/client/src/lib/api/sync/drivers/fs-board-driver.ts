import type { Change } from "@doska/contract"
import type { PushInput, PushResult } from "@doska/sync"
import type { Dashboard } from "@/lib/types"
import { COLUMNS, DASHBOARDS } from "../../constants"
import { idb } from "../../db/idb"
import { getSyncFolder } from "../../runtime"
import { FsStore } from "../fs/fs-store"
import { BoardDriverBase } from "./board-driver-base"

/** Columns must be written before cards so a card's parent folder exists. */
function columnsFirst(a: Change, b: Change): number {
  const rank = (c: Change) => (c.store === COLUMNS ? 0 : 1)
  return rank(a) - rank(b)
}

/**
 * Filesystem counterpart of {@link DeckSyncDriver}: `push` writes dirty
 * columns/cards to a Markdown folder, then scans the board subtree for external
 * edits, adoptions, and deletions.
 */
export class FsBoardDriver extends BoardDriverBase {
  protected readonly cursorPrefix = "cursor:fs:"

  async push(input: PushInput<string, Change>): Promise<PushResult<Change>> {
    const store = new FsStore(getSyncFolder())

    // Materialize the board folder from the local Dashboard so columns/cards
    // have a home even if the list channel hasn't run yet. Its `_index.md` is
    // stamped with the existing board id, so the list scan won't re-adopt it.
    const board = await idb.get<Dashboard>(DASHBOARDS, input.scope)
    if (board) await store.ensureBoardFolder(board)

    for (const change of [...input.changes].sort(columnsFirst))
      await store.write(change)

    // Capture the cursor after writing so our own files aren't re-scanned next
    // tick; the scan still uses the old `since` to catch edits made meanwhile.
    const cursor = Date.now()
    const changes = await store.scanBoard(input.scope, input.since)
    await store.flush()
    return { cursor, changes }
  }
}
