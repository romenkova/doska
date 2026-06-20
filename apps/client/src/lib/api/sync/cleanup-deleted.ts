import type { StoreName } from "../constants"
import { idb } from "../db/idb"

/**
 * Hard-deletes local tombstones that have already reached the server, reclaiming
 * IndexedDB space so deleted records don't accumulate forever.
 */
export async function cleanupDeleted(
  dirty: Set<string>,
  candidates: Array<{ store: StoreName; id: string }>
): Promise<void> {
  for (const { store, id } of candidates) {
    if (dirty.has(`${store}/${id}`)) continue
    try {
      const record = await idb.get<{ deletedAt: number | null }>(store, id)
      if (record?.deletedAt != null) await idb.delete(store, id)
    } catch (err) {
      console.warn("[sync] compaction failed for", store, id, err)
    }
  }
}
