import {
  CARDS,
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  COLUMNS,
  DASHBOARDS,
  META_STORE,
  SIDEBAR,
} from "@doska/core/constants"
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
})
