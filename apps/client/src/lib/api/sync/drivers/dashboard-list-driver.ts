import type { DashboardChange } from "@doska/contract"
import type { PushInput } from "@doska/sync"
import { orpc } from "../orpc"
import { DashboardListDriverBase } from "./dashboard-list-driver-base"

export { DASHBOARDS_SCOPE } from "./dashboard-list-driver-base"

/** Syncs the dashboard list against the server via oRPC's `dashboards.sync`. */
export class DashboardListDriver extends DashboardListDriverBase {
  protected readonly cursorKey = "cursor:dashboards-list"

  push(input: PushInput<string, DashboardChange>) {
    return orpc.dashboards.sync({
      since: input.since,
      changes: input.changes,
    })
  }
}
