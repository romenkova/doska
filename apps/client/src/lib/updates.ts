import { getServerUrl, getServerVersion } from "./api/server"
import { getAutoUpdate } from "./auto-update"
import { isDesktop } from "./platform"

/**
 * Result of an update check, shaped for the UI to act on. Desktop updates come
 * from the Tauri updater and name a version; web updates come from a waiting
 * service worker, which only signals that a newer build exists.
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

/** What {@link checkForUpdates} can return — never the web variant. */
export type DesktopUpdateState = Exclude<UpdateState, { kind: "web" }>

const NONE: DesktopUpdateState = { status: "none" }

export async function checkForUpdates(): Promise<DesktopUpdateState> {
  if (!isDesktop() || !getServerUrl()) return NONE
  try {
    // Desktop pins to whatever version the server runs. We send it to the
    // update proxy, which serves that exact build.
    const serverVersion = await getServerVersion()
    if (!serverVersion) return NONE

    const { check } = await import("@tauri-apps/plugin-updater")
    const update = await check({
      headers: { "x-deck-server-version": serverVersion },
    })
    if (!update || update.version !== serverVersion) return NONE

    const install = async () => {
      await update.downloadAndInstall()
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    }

    if (getAutoUpdate()) {
      await install()
      return NONE
    }

    return { status: "available", kind: "desktop", version: update.version, install }
  } catch (err) {
    // Never let a failed update check break app startup.
    console.error("update check failed", err)
    return NONE
  }
}
