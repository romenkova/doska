import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Marks the column whose cards count as finished. A board can have any number. */
export async function setColumnDone(id: string, done: boolean): Promise<void> {
  const columns = await db.getColumns()
  const column = columns.find((c) => c.id === id)
  if (!column) return

  await db.setColumn({ ...column, done, updatedAt: stamp() })
  sync.markDirty("columns", id)
}
