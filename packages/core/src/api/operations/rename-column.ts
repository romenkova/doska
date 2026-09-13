import { db } from "../db/db"
import { sync } from "../sync"
import { touchColumn } from "../sync/touch"

/** Renames a column. */
export async function renameColumn(id: string, title: string): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  await db.setColumn(touchColumn({ ...column, title }, ["title"]))
  sync.markDirty("columns", id)
}
