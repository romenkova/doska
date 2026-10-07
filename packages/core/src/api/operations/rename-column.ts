import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"
import { touchColumn } from "../sync/touch"

/** Renames a column. */
export async function renameColumn(id: string, title: string): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  await db.setColumn(touchColumn({ ...column, title }, ["title"]))
  sync.markDirty("columns", id)
  if (column.title === title) return
  await recordHistory.column(column.dashboardId, id, "rename", {
    from: column.title,
    to: title,
  })
}
