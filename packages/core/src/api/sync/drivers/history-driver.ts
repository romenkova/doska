import type { DirtyStore, PushInput, PushResult, SyncDriver } from "@doska/sync"
import { keys } from "../../../data/keys"
import { queryClient } from "../../../query-client"
import { runtime } from "../../../runtime"
import type { HistoryEntry } from "../../../types"
import { HISTORY } from "../../constants"
import { orpc } from "../orpc"
import * as generic from "./channel-shared"

export const HISTORY_SCOPE = "history"

const CURSOR_KEY = "cursor:history"

export function resetHistoryCursor(): Promise<void> {
  return generic.saveCursor(CURSOR_KEY, 0)
}

export class HistoryDriver implements SyncDriver<string, HistoryEntry> {
  push(
    input: PushInput<string, HistoryEntry>
  ): Promise<PushResult<HistoryEntry>> {
    return orpc.history.sync({ since: input.since, changes: input.changes })
  }

  loadCursor(): Promise<number> {
    return generic.loadCursor(CURSOR_KEY)
  }

  saveCursor(_scope: string, value: number): Promise<void> {
    return generic.saveCursor(CURSOR_KEY, value)
  }

  async collectChanges(_scope: string, dirty: DirtyStore) {
    const changes: HistoryEntry[] = []
    const refs: string[] = []
    const missing: string[] = []

    for (const ref of dirty.all()) {
      const [store, id] = ref.split("/")
      if (store !== HISTORY) continue
      const entry = await runtime().db.get<HistoryEntry>(HISTORY, id)
      if (entry) {
        changes.push(entry)
        refs.push(ref)
      } else {
        missing.push(ref)
      }
    }

    if (missing.length) dirty.drop(missing)
    return { changes, refs }
  }

  async applyRemote(_scope: string, entries: HistoryEntry[]): Promise<void> {
    for (const entry of entries) {
      const local = await runtime().db.get<HistoryEntry>(HISTORY, entry.id)
      // A same-version row still lands, so the server's userId replaces our local null.
      if (local && local.updatedAt > entry.updatedAt) continue
      await runtime().db.set(HISTORY, entry.id, entry)
    }
    if (entries.length)
      queryClient.invalidateQueries({ queryKey: keys.activity })
  }

  refOf(entry: HistoryEntry): string {
    return `${HISTORY}/${entry.id}`
  }

  // History rows are never tombstoned, so there is nothing to compact.
  compact(): Promise<void> {
    return Promise.resolve()
  }
}
