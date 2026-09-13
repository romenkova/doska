import { db } from "../db/db"
import { sync } from "../sync"
import { touchColumn } from "../sync/touch"

/** Sets a column's palette color (`""` clears it). */
export async function setColumnColor(id: string, color: string): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  await db.setColumn(touchColumn({ ...column, color }, ["color"]))
  sync.markDirty("columns", id)
}
