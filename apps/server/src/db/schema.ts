import type { Attachment, MemberRole, SidebarItem } from "@doska/contract"
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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
export const dashboards = pgTable(
  "dashboards",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    sort: jsonb("sort").$type<string[]>().notNull().default([]),
    ownerId: text("owner_id"),
    publicToken: text("public_token").unique(),
    publishedAt: bigint("published_at", { mode: "number" }),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("dashboards_owner_seq").on(t.ownerId, t.seq)]
)

export const columns = pgTable(
  "columns",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    collapsed: boolean("collapsed").notNull().default(false),
    color: text("color").notNull().default(""),
    done: boolean("done").notNull().default(false),
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
    number: integer("number"),
    deadline: text("deadline"),
    priority: text("priority").notNull().default(""),
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

/**
 * Boards shared with an account other than the owner.
 *
 * `seq` is stamped from the *board-list* counter (`counters.id = 'boards-list'`,
 * the same one dashboards use), not from a per-board counter, and it is the
 * point of the table. A client's board-list cursor has usually already passed
 * the shared board's own `dashboards.seq`, so nothing would ever reach it;
 * stamping the membership row from the same global counter puts an event past
 * that cursor. Re-stamp it on every change to the row, revocation included.
 *
 * Revoking sets `revoked_at` and never deletes: a deleted row carries no `seq`,
 * so the client would never learn it lost access.
 */
export const boardMembers = pgTable(
  "board_members",
  {
    boardId: text("board_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").$type<MemberRole>().notNull().default("editor"),
    seq: integer("seq").notNull(),
    revokedAt: bigint("revoked_at", { mode: "number" }),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.boardId, t.userId] }),
    index("board_members_user_seq").on(t.userId, t.seq),
  ]
)

// Keyed by user, so a push can only land on the caller's row. `seq` is from the
// board-list counter. Never tombstoned.
export const sidebarLayouts = pgTable("sidebar_layouts", {
  userId: text("user_id").primaryKey(),
  items: jsonb("items").$type<SidebarItem[]>().notNull().default([]),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  seq: integer("seq").notNull(),
})
