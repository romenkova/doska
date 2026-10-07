import { IDB } from "@doska/client-db"
import {
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  CARDS_BY_NUMBER,
  HISTORY,
  HISTORY_BY_CREATED,
  HISTORY_BY_ENTITY,
  META_STORE,
  STORES,
} from "@doska/core"

const DB_NAME = "deck"
const VERSION = 14

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
    if (!cards.indexNames.contains(CARDS_BY_DEADLINE))
      cards.createIndex(CARDS_BY_DEADLINE, "deadline")
    if (!cards.indexNames.contains(CARDS_BY_NUMBER))
      cards.createIndex(CARDS_BY_NUMBER, "number")

    const history = tx.objectStore(HISTORY)
    if (!history.indexNames.contains(HISTORY_BY_ENTITY))
      history.createIndex(HISTORY_BY_ENTITY, "entityId")
    if (!history.indexNames.contains(HISTORY_BY_CREATED))
      history.createIndex(HISTORY_BY_CREATED, "createdAt")
  }
}

export const webDb = new DeckDB(DB_NAME, VERSION)
