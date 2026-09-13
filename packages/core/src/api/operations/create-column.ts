import { generateKeyBetween } from "fractional-indexing"
import { db } from "../db/db"
import { newId } from "./new-id"
import { live } from "./live"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Appends an empty column to a board and returns its new id. */
export async function createColumn(
  dashboardId: string,
  title: string
): Promise<string> {
  const id = newId("col")
  const columns = (await db.getColumns()).filter(
    (c) => c.dashboardId === dashboardId && live(c)
  )
  const last = columns.reduce<string | null>(
    (max, c) => (max === null || c.position > max ? c.position : max),
    null
  )
  const position = generateKeyBetween(last, null)
  await db.setColumn({
    id,
    title,
    position,
    dashboardId,
    collapsed: false,
    color: "",
    done: false,
    updatedAt: stamp(),
    deletedAt: null,
    stamps: {},
  })
  sync.markDirty("columns", id)
  return id
}
