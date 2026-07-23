import { db } from "../db/db"
import { live } from "./live"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/**
 * Marks the column whose cards count as finished. A board has at most one, so
 * marking one clears whichever column held the flag before.
 */
export async function setColumnDone(id: string, done: boolean): Promise<void> {
  const columns = await db.getColumns()
  const column = columns.find((c) => c.id === id)
  if (!column) return

  const previous = done
    ? columns.filter(
        (c) =>
          c.done &&
          c.id !== id &&
          c.dashboardId === column.dashboardId &&
          live(c)
      )
    : []

  for (const c of previous) {
    await db.setColumn({ ...c, done: false, updatedAt: stamp() })
    sync.markDirty("columns", c.id)
  }

  await db.setColumn({ ...column, done, updatedAt: stamp() })
  sync.markDirty("columns", id)
}
