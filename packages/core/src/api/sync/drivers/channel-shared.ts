import {
  RETENTION_MS,
  type Change,
  type DashboardChange,
} from "@doska/contract"
import type { DirtyStore } from "@doska/sync"
import { runtime } from "../../../runtime"
import { META_STORE, type StoreName } from "../../constants"
import { db } from "../../db/db"

/** Cursor IO, ref identity, and compaction — shared by every driver. */

/** 0 (pull everything) when unset. */
export async function loadCursor(key: string): Promise<number> {
  const raw = await runtime().db.get<number>(META_STORE, key)
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
}

export async function saveCursor(key: string, value: number): Promise<void> {
  try {
    await runtime().db.set(META_STORE, key, value)
  } catch {
    // Storage unavailable; the next sync re-pulls from the in-memory cursor.
  }
}

/** Forgets a cursor, so a scope that comes back is pulled from scratch. */
export async function clearCursor(key: string): Promise<void> {
  try {
    await runtime().db.delete(META_STORE, key)
  } catch {
    // Storage unavailable; a stale cursor is harmless next to a failed drop.
  }
}

export function refOf(change: Change | DashboardChange): string {
  return `${change.store}/${change.record.id}`
}

/**
 * Hard-deletes tombstones the backend has acked *and* that have aged out of the
 * trash; keeps still-dirty refs. A fresh tombstone is what the trash view reads,
 * so it survives the sync that acked it — see `purgeExpired`, which sweeps the
 * ones no pull happens to touch.
 */
export async function compact(
  dirty: DirtyStore,
  refs: string[]
): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS
  for (const ref of refs) {
    if (dirty.has(ref)) continue
    const [store, id] = ref.split("/")
    try {
      const record = await runtime().db.get<{ deletedAt: number | null }>(
        store,
        id
      )
      if (record?.deletedAt != null && record.deletedAt < cutoff)
        await db.hardDelete(store as StoreName, id)
    } catch (err) {
      console.warn("[sync] compaction failed for", store, id, err)
    }
  }
}
