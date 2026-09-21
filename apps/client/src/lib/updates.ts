import { invoke } from "@tauri-apps/api/core"
import { getServerUrl, getServerVersion } from "@doska/core/server"
import { isDesktop } from "./platform"

/**
 * Result of an update check, shaped for the UI to act on. Desktop updates come
 * from the Tauri updater and name a version; web updates come from a waiting
 * service worker, which only signals that a newer build exists. `mismatch` is
 * desktop on a sync server that runs an older version than this app.
 */
export type UpdateState =
  | { status: "none" }
  | {
      status: "available"
      kind: "desktop"
      version: string
      install: () => Promise<void>
    }
  | { status: "available"; kind: "web"; install: () => Promise<void> }
  | { status: "mismatch"; version: string; install: () => Promise<void> }

/** What {@link checkForUpdates} can return — never the web variant. */
export type DesktopUpdateState = Exclude<UpdateState, { kind: "web" }>

const NONE: DesktopUpdateState = { status: "none" }

export async function checkForUpdates(): Promise<DesktopUpdateState> {
  if (!isDesktop()) return NONE
  try {
    // With a sync server, desktop installs the version that server runs;
    // without one it takes the latest release.
    let serverVersion: string | null = null
    if (getServerUrl()) {
      serverVersion = await getServerVersion()
      if (!serverVersion) return NONE
    }

    const found = await invoke<{ version: string; newer: boolean } | null>(
      "check_update",
      { serverVersion }
    )
    if (!found) return NONE

    const install = async () => {
      await invoke("install_update", { serverVersion })
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    }

    if (!found.newer) {
      return { status: "mismatch", version: found.version, install }
    }

    return {
      status: "available",
      kind: "desktop",
      version: found.version,
      install,
    }
  } catch (err) {
    // Never let a failed update check break app startup.
    console.error("update check failed", err)
    return NONE
  }
}
