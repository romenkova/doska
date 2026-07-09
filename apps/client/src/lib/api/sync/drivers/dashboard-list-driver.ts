import type { DashboardChange } from "@doska/contract"
import type {
  DirtyStore,
  PushInput,
  PushResult,
  SyncDriver,
} from "@doska/sync"
import { orpc } from "../orpc"
import * as dashboards from "./dashboard-channel"
import * as generic from "./channel-shared"

/** The list is account-level, so its engine stays pointed here for the app's life. */
export const DASHBOARDS_SCOPE = "dashboards"

const CURSOR_KEY = "cursor:dashboards-list"

/** Syncs the dashboard list against the server via oRPC's `dashboards.sync`. */
export class DashboardListDriver
  implements SyncDriver<string, DashboardChange>
{
  push(
    input: PushInput<string, DashboardChange>
  ): Promise<PushResult<DashboardChange>> {
    return orpc.dashboards.sync({
      since: input.since,
      changes: input.changes,
    })
  }

  loadCursor(): Promise<number> {
    return generic.loadCursor(CURSOR_KEY)
  }

  saveCursor(_scope: string, value: number): Promise<void> {
    return generic.saveCursor(CURSOR_KEY, value)
  }

  collectChanges(_scope: string, dirty: DirtyStore) {
    return dashboards.collectDashboardChanges(dirty)
  }

  applyRemote(_scope: string, changes: DashboardChange[]): Promise<void> {
    return dashboards.applyDashboardRemote(changes)
  }

  refOf(change: DashboardChange): string {
    return generic.refOf(change)
  }

  compact(dirty: DirtyStore, refs: string[]): Promise<void> {
    return generic.compact(dirty, refs)
  }
}
