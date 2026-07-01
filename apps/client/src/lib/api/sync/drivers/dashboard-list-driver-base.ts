import type { DashboardChange } from "@doska/contract"
import type {
  DirtyStore,
  PushInput,
  PushResult,
  SyncDriver,
} from "@doska/sync"
import * as dashboards from "./dashboard-channel"
import * as generic from "./channel-shared"

/** The list is account-level, so its engine stays pointed here for the app's life. */
export const DASHBOARDS_SCOPE = "dashboards"

/**
 * Account-level dashboard-list channel wiring. Concrete drivers add only the
 * cursor key ({@link cursorKey}) and transport ({@link push}).
 */
export abstract class DashboardListDriverBase
  implements SyncDriver<string, DashboardChange>
{
  protected abstract readonly cursorKey: string

  abstract push(
    input: PushInput<string, DashboardChange>
  ): Promise<PushResult<DashboardChange>>

  loadCursor(): Promise<number> {
    return generic.loadCursor(this.cursorKey)
  }

  saveCursor(_scope: string, value: number): Promise<void> {
    return generic.saveCursor(this.cursorKey, value)
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
