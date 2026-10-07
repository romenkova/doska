import {
  CARDS,
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  COLUMNS,
  DASHBOARDS,
  HISTORY,
  HISTORY_BY_CREATED,
  HISTORY_BY_ENTITY,
  META_STORE,
  SIDEBAR,
} from "@doska/core"
import { SQLiteDB } from "./sqlite-db"

const DB_NAME = "deck.db"
/** Tracked in `PRAGMA user_version`. Independent of the web DB's version — the
 * two schemas are only ever compared through the records they hold. */
const VERSION = 1

export const mobileDb = new SQLiteDB(DB_NAME, VERSION, {
  [CARDS]: [CARDS_BY_COLUMN, CARDS_BY_DEADLINE],
  [COLUMNS]: [],
  [DASHBOARDS]: [],
  [META_STORE]: [],
  [SIDEBAR]: [],
  [HISTORY]: [HISTORY_BY_ENTITY, HISTORY_BY_CREATED],
})
