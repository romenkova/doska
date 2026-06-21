import type { DashboardChange } from "@deck/contract"
import type { DirtyStore, SyncDriver } from "@deck/sync"
import type { Dashboard } from "@/lib/types"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import { DASHBOARDS } from "../../constants"
import { idb, META_STORE } from "../../db/idb"
import { orpc } from "../orpc"

/**
 * The single scope this driver ever syncs. The dashboard list is account-level,
 * not per-board, so its engine stays pointed here for the app's whole lifetime
 * regardless of which board is open.
 */
export const DASHBOARDS_SCOPE = "dashboards"

/** meta-store key for the dashboard list's pull cursor (account seq). */
const CURSOR_KEY = "cursor:dashboards-list"

/**
 * Syncs the dashboard *list* on its own board-independent channel: oRPC's
 * `dashboards.sync` is the transport, and changes/cursor live in IndexedDB.
 * Without this the list could only ever pull the open board's own dashboard, so
 * other boards' create/rename/delete never reached an authorized session.
 */
export class DashboardListDriver implements SyncDriver<string, DashboardChange> {
  /** Reads the list's last pull cursor; 0 means "pull every dashboard" on first sync. */
  async loadCursor(): Promise<number> {
    const raw = await idb.get<number>(META_STORE, CURSOR_KEY)
    return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
  }

  /** Persists the list cursor so a reload resumes the pull where it left off. */
  async saveCursor(_scope: string, value: number): Promise<void> {
    try {
      await idb.set(META_STORE, CURSOR_KEY, value)
    } catch {
      // Storage unavailable; the next sync re-pulls from the in-memory cursor.
    }
  }

  /**
   * Resolves the dirty `dashboards/*` refs into a `DashboardChange[]` to push,
   * alongside the refs consumed (restored if the push fails). Unlike the board
   * driver this isn't board-scoped: every dirty dashboard goes up at once.
   */
  async collectChanges(
    _scope: string,
    dirty: DirtyStore
  ): Promise<{ changes: DashboardChange[]; refs: string[] }> {
    const changes: DashboardChange[] = []
    const refs: string[] = []
    const dead: string[] = []

    for (const ref of dirty.all()) {
      const [store, id] = ref.split("/")
      if (store !== DASHBOARDS) continue

      const record = await idb.get<Dashboard>(DASHBOARDS, id)
      if (!record) {
        dead.push(ref)
        continue
      }
      changes.push({ store: DASHBOARDS, record })
      refs.push(ref)
    }

    if (dead.length) dirty.clear(dead)

    return { changes, refs }
  }

  push(input: { since: number; changes: DashboardChange[] }) {
    return orpc.dashboards.sync({
      since: input.since,
      changes: input.changes,
    })
  }

  async applyRemote(_scope: string, changes: DashboardChange[]): Promise<void> {
    let touched = false

    for (const { record } of changes) {
      const existing = await idb.get<{ updatedAt: number }>(DASHBOARDS, record.id)
      if (existing && existing.updatedAt >= record.updatedAt) continue
      await idb.set(DASHBOARDS, record.id, record)
      touched = true
    }

    if (touched) queryClient.invalidateQueries({ queryKey: keys.dashboards })
  }

  refOf(change: DashboardChange): string {
    return `${change.store}/${change.record.id}`
  }

  /**
   * Hard-deletes local dashboard tombstones that have already reached the
   * server, reclaiming IndexedDB space. Any ref still dirty (re-touched before
   * this push landed) is kept.
   */
  async compact(dirty: DirtyStore, refs: string[]): Promise<void> {
    for (const ref of refs) {
      if (dirty.has(ref)) continue
      const [store, id] = ref.split("/")
      if (store !== DASHBOARDS) continue
      try {
        const record = await idb.get<{ deletedAt: number | null }>(store, id)
        if (record?.deletedAt != null) await idb.delete(store, id)
      } catch (err) {
        console.warn("[sync] dashboard compaction failed for", id, err)
      }
    }
  }
}
