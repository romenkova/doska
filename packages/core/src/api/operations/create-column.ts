import { COLUMN_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { db } from "../db/db"
import { newId } from "./new-id"
import { live } from "./live"
import { sync } from "../sync"
import { touchColumn } from "../sync/touch"

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
  const column = {
    id,
    title,
    position,
    dashboardId,
    collapsed: false,
    color: "",
    done: false,
    updatedAt: 0,
    deletedAt: null,
    stamps: {},
  }
  await db.setColumn(touchColumn(column, COLUMN_GROUPS))
  sync.markDirty("columns", id)
  return id
}
