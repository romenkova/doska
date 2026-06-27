import { generateKeyBetween } from "fractional-indexing"
import { db } from "../db/db"
import { live } from "./live"
import { sync } from "../sync"

/** Appends an empty column to a board and returns its new id. */
export async function createColumn(
  dashboardId: string,
  title: string
): Promise<string> {
  const id = `col-${crypto.randomUUID().slice(0, 8)}`
  const columns = (await db.getColumns()).filter(
    (c) => c.dashboardId === dashboardId && live(c)
  )
  const last = columns.reduce<
    string | null
  >((max, c) => (max === null || c.position > max ? c.position : max), null)
  const position = generateKeyBetween(last, null)
  await db.setColumn({
    id,
    title,
    position,
    dashboardId,
    collapsed: false,
    updatedAt: Date.now(),
    deletedAt: null,
  })
  sync.markDirty("columns", id)
  return id
}
