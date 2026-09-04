import { z } from "zod"

/**
 * Entity schemas shared by client and server
 *
 *  - `updatedAt`: client clock (ms). The last-writer-wins tiebreaker.
 *  - `deletedAt`: tombstone. `null` while live; set to a timestamp on delete so
 *    the deletion propagates to other clients instead of vanishing silently.
 */

/**
 * A file attached to a card.
 *
 *  - `name`: editable display label, shown on the tile. Independent of storage.
 *  - `key`: opaque, backend-specific handle (an S3 object key, or a filename in
 *    the card's on-disk sidecar). Rewritten when files migrate between backends.
 */

const ATTACHMENT_KEY =
  /^att\/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}(\.[a-z0-9]+)?$/

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string().regex(ATTACHMENT_KEY),
  mime: z.string(),
  size: z.number(),
})

export const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  position: z.string(),
  columnId: z.string(),
  /**
   * Human-readable per-board card number, shown as the card's id. Allocated
   * server-side from a per-board counter on the card's first sync, so it's
   * `null` until then.
   */
  number: z.number().nullable().default(null),
  /** Optional deadline as an ISO date string (`YYYY-MM-DD`); `null` when unset. */
  deadline: z.string().nullable().default(null),
  /** Importance: `high` / `medium` / `low`, empty for none. See `PRIORITIES`. */
  priority: z.string().default(""),
  /** Attached files; travels with the card's last-writer-wins record. */
  attachments: z.array(AttachmentSchema).default([]),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const ColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  dashboardId: z.string(),
  /** When true the column's card bodies are collapsed down to their titles. */
  collapsed: z.boolean().default(false),
  /**
   * Palette id tinting the column and any `[[card]]` reference to a card in
   * it. Empty for no color; see `COLUMN_COLORS` in the ui-kit.
   */
  color: z.string().default(""),
  /** Cards in this column are finished. At most one column per board has it. */
  done: z.boolean().default(false),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const DashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  sort: z.array(z.string()).default([]),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

/**
 * One entry of the sidebar tree
 */
export const SidebarItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("board"), id: z.string() }),
  z.object({
    type: z.literal("folder"),
    id: z.string(),
    title: z.string(),
    collapsed: z.boolean().default(false),
    boardIds: z.array(z.string()).default([]),
  }),
])

/**
 * How one account lays out its sidebar. A single record per user.
 */
export const SidebarLayoutSchema = z.object({
  id: z.literal("layout"),
  items: z.array(SidebarItemSchema).default([]),
  updatedAt: z.number(),
  deletedAt: z.null(),
})

/**
 * The whole of a published board, as `GET /api/public/b/:token` returns it.
 *
 * Built out of the record schemas above on purpose: everything the sync tables
 * carry beyond them — `seq`, `owner_id`, the share token itself — is internal,
 * and reusing the wire shapes is what keeps it out. Tombstones are excluded by
 * the query, so every record here is live.
 */
export const PublicBoardSchema = z.object({
  dashboard: DashboardSchema,
  columns: z.array(ColumnSchema),
  cards: z.array(CardSchema),
})

/** Ship editors only; `'owner'` exists so widening roles needs no migration. */
export const MemberRoleSchema = z.enum(["owner", "editor"])

/** Someone with access to a board, as the share dialog's roster renders them.
 * The owner is in there too, with `role: 'owner'` and no membership row. */
export const MemberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  role: MemberRoleSchema,
})

/** An account in the server's directory — everything the member picker gets. */
export const DirectoryUserSchema = z.object({
  id: z.string(),
  username: z.string(),
})

const DashboardRecordChangeSchema = z.object({
  store: z.literal("dashboards"),
  record: DashboardSchema,
})

const SidebarChangeSchema = z.object({
  store: z.literal("sidebar"),
  record: SidebarLayoutSchema,
})

/** A change on the account-level channel (see `dashboards.sync`): a dashboard
 * or the caller's sidebar layout. */
export const DashboardChangeSchema = z.discriminatedUnion("store", [
  DashboardRecordChangeSchema,
  SidebarChangeSchema,
])

/** One board-channel record change, tagged by the store it belongs to. */
export const ChangeSchema = z.discriminatedUnion("store", [
  z.object({ store: z.literal("cards"), record: CardSchema }),
  z.object({ store: z.literal("columns"), record: ColumnSchema }),
  DashboardRecordChangeSchema,
])
