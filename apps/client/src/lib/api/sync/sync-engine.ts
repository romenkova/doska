import type { Change } from "@deck/contract"
import { SyncEngine } from "@deck/sync"
import type { StoreName } from "../constants"
import { DeckSyncDriver } from "./driver"

/**
 * Deck-flavored engine: specializes the generic {@link SyncEngine} for deck,
 * giving the call sites their vocabulary (dirty refs are `store/key`, the scope
 * is the open board) on top of the inherited `reconcile`.
 */
class DeckSync extends SyncEngine<string, Change> {
  constructor() {
    super(new DeckSyncDriver(), { storageKey: "deck:sync:dirty" })
  }

  /** Flags a record as changed locally and awaiting sync. */
  markDirty(store: StoreName, key: string) {
    this.mark(`${store}/${key}`)
  }

  /** Points sync at the open board and reconciles it immediately. */
  setActiveBoard(boardId: string | null) {
    this.setActiveScope(boardId)
  }
}

/**
 * The one engine the app drives. There's a single open board and a single dirty
 * queue, so it's a singleton.
 */
export const sync = new DeckSync()
