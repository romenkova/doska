import { IDB } from "@doska/client-db"
import { STORES } from "../constants"

const DB_NAME = "deck"
const VERSION = 9

/** Sync bookkeeping (the pull cursor) — kept in the DB so it shares the data's
 * lifetime. Not dropped on upgrade, but gone if the whole DB is deleted. */
export const META_STORE = "meta"

/** Index on `cards.columnId`, so a column's cards are an engine-side range seek
 * (`getCards(columnId)`) instead of a full-store scan. The primary key stays the
 * card id, so lookups by id (`getCard`) remain a direct get. */
export const CARDS_BY_COLUMN = "columnId"

class DeckDB extends IDB {
  upgrade(db: IDBDatabase, tx: IDBTransaction) {
    for (const store of STORES) {
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
    }
    // The meta store persists across upgrades — only create it if missing.
    if (!db.objectStoreNames.contains(META_STORE))
      db.createObjectStore(META_STORE)

    // Add the column index to the (possibly pre-existing) cards store. The
    // versionchange `tx` is how we reach a store that wasn't just created.
    const cards = tx.objectStore("cards")
    if (!cards.indexNames.contains(CARDS_BY_COLUMN))
      cards.createIndex(CARDS_BY_COLUMN, "columnId")
  }
}

export const idb = new DeckDB(DB_NAME, VERSION)
