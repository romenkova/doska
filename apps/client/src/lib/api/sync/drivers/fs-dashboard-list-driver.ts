import type { DashboardChange } from "@doska/contract"
import type { PushInput, PushResult } from "@doska/sync"
import { getSyncFolder } from "../../runtime"
import { FsStore } from "../fs/fs-store"
import { DashboardListDriverBase } from "./dashboard-list-driver-base"

/**
 * Filesystem counterpart of {@link DashboardListDriver}: maps each board to a
 * top-level folder with an `_index.md`; `push` writes dirty board folders then
 * scans the root for external board create/rename/delete.
 */
export class FsDashboardListDriver extends DashboardListDriverBase {
  protected readonly cursorKey = "cursor:fs:dashboards-list"

  async push(
    input: PushInput<string, DashboardChange>
  ): Promise<PushResult<DashboardChange>> {
    const store = new FsStore(getSyncFolder())
    for (const change of input.changes) await store.write(change)
    const cursor = Date.now()
    const changes = await store.scanBoards(input.since)
    await store.flush()
    return { cursor, changes }
  }
}
