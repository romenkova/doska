import { z } from "zod"

/**
 * Entity schemas shared by client and server
 *
 *  - `updatedAt`: client clock (ms). The last-writer-wins tiebreaker.
 *  - `deletedAt`: tombstone. `null` while live; set to a timestamp on delete so
 *    the deletion propagates to other clients instead of vanishing silently.
 */

export const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  position: z.string(),
  columnId: z.string(),
  /** Optional deadline as an ISO date string (`YYYY-MM-DD`); `null` when unset. */
  deadline: z.string().nullable().default(null),
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
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const DashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

/** A dashboard list change. The dashboard list syncs on its own account-level
 * channel (see `dashboards.sync`), independent of any open board, so it carries
 * only dashboard records. */
export const DashboardChangeSchema = z.object({
  store: z.literal("dashboards"),
  record: DashboardSchema,
})

/** One record change, tagged by the store it belongs to. */
export const ChangeSchema = z.discriminatedUnion("store", [
  z.object({ store: z.literal("cards"), record: CardSchema }),
  z.object({ store: z.literal("columns"), record: ColumnSchema }),
  DashboardChangeSchema,
])
