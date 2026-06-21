import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/** Per-board sequence counter; created lazily on a board's first sync. */
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  seqCounter: integer("seq_counter").notNull().default(0),
})

/**
 * Named monotonic counters that aren't owned by a single board. The dashboard
 * list uses one (id `"dashboards"`) so list changes get an account-level
 * ordering, letting a client pull every board's metadata past its cursor
 * regardless of which board is open.
 */
export const counters = sqliteTable("counters", {
  id: text("id").primaryKey(),
  value: integer("value").notNull().default(0),
})

/**
 * The three entity tables mirror `@deck/contract` (= the client's `types.ts`),
 * each augmented with sync metadata:
 *
 *  - `updatedAt`: client clock, the last-writer-wins tiebreaker.
 *  - `deletedAt`: tombstone (null = live).
 *  - `seq`: stamped from the owning board's counter on every write, so a client
 *    can pull everything past its cursor with `board_id = ? AND seq > since`.
 *
 * `boardId` is denormalized onto columns and cards so that pull is a single
 * indexed scan with no joins. A dashboard *is* a board, so it's keyed by `id`.
 * Relationships are by id only — no FK constraints, so an out-of-order tick
 * (a card arriving before its column) is never rejected.
 *
 * A dashboard's `seq` is stamped from the account-level `counters` row, not a
 * board counter: the list is board-independent, so its pull is `seq > since`
 * across every dashboard.
 */
export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  position: text("position").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
  seq: integer("seq").notNull(),
})

export const columns = sqliteTable(
  "columns",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    seq: integer("seq").notNull(),
  },
  (t) => [index("columns_board_seq").on(t.boardId, t.seq)]
)

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    columnId: text("column_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    position: text("position").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    seq: integer("seq").notNull(),
  },
  (t) => [index("cards_board_seq").on(t.boardId, t.seq)]
)
