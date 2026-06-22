import type { Column } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

/**
 * Persists columns whose position changed during a reorder. Only the position
 * is applied: the title is read back from the stored record so a concurrent
 * rename isn't clobbered by a stale copy from the board cache.
 */
export async function moveColumn(changed: Column[]): Promise<void> {
  const now = Date.now()
  const byId = new Map((await db.getColumns()).map((c) => [c.id, c]))
  await Promise.all(
    changed.map(async (column) => {
      const existing = byId.get(column.id)
      if (!existing) return
      await db.setColumn({
        ...existing,
        position: column.position,
        updatedAt: now,
      })
    })
  )
  for (const column of changed) sync.markDirty("columns", column.id)
}
