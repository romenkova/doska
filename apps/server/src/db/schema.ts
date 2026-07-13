import type { Attachment } from "@doska/contract"
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core"

// Auth is better-auth's, schema and all; it lives beside ours so that one
// `import * as schema` covers both the adapter and drizzle-kit.
export * from "./auth-schema"

/**
 * Timestamps and sequence numbers are stored as plain integers, but a board's
 * `updatedAt`/`deletedAt` are epoch milliseconds (~1.7e12) and overflow a
 * 32-bit `integer`, so they use `bigint` in `number` mode. Sequence counters
 * stay `integer`: a single channel's monotonic tick never approaches 2^31.
 */

/**
 * Named monotonic counters, one per sync channel, created lazily on first sync.
 * Each board keeps its per-board tick under id `board:<id>`; the dashboard list
 * uses id `"dashboards"` for an account-level ordering, letting a client pull
 * every board's metadata past its cursor regardless of which board is open.
 */
export const counters = pgTable("counters", {
  id: text("id").primaryKey(),
  value: integer("value").notNull().default(0),
})

/**
 * The three entity tables mirror `@doska/contract` (= the client's `types.ts`),
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
export const dashboards = pgTable("dashboards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  position: text("position").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  deletedAt: bigint("deleted_at", { mode: "number" }),
  seq: integer("seq").notNull(),
})

export const columns = pgTable(
  "columns",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    collapsed: boolean("collapsed").notNull().default(false),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("columns_board_seq").on(t.boardId, t.seq)]
)

export const cards = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    columnId: text("column_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    position: text("position").notNull(),
    deadline: text("deadline"),
    attachments: jsonb("attachments")
      .$type<Attachment[]>()
      .notNull()
      .default([]),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("cards_board_seq").on(t.boardId, t.seq)]
)
