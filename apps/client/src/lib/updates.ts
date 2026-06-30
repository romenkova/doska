import {
  getAutoUpdate,
  getServerUrl,
  getServerVersion,
  isDesktop,
} from "./api/runtime"

/** Result of an update check, shaped for the UI to act on. */
export type UpdateState =
  | { status: "none" }
  | { status: "available"; version: string; install: () => Promise<void> }

const NONE: UpdateState = { status: "none" }

/** True when two versions share the same `major.minor` (patch may differ). */
function sameMinor(a: string, b: string): boolean {
  const minor = (v: string) => v.split(".").slice(0, 2).join(".")
  return minor(a) === minor(b)
}

export async function checkForUpdates(): Promise<UpdateState> {
  if (!isDesktop()) return NONE
  try {
    const { check } = await import("@tauri-apps/plugin-updater")

    // Pin to the server's release line when a server is configured. We send the
    // server version to the update proxy so it serves the newest build on that
    // major.minor line .
    let serverVersion: string | null = null
    const headers: Record<string, string> = {}
    if (getServerUrl()) {
      serverVersion = await getServerVersion()
      if (!serverVersion) return NONE
      headers["x-deck-server-version"] = serverVersion
    }

    const update = await check({ headers })
    if (!update) return NONE

    // Safety net: an older proxy may ignore the hint and return the overall
    // latest, so re-check the line client-side before offering the update.
    if (serverVersion && !sameMinor(update.version, serverVersion)) {
      return NONE
    }

    const install = async () => {
      await update.downloadAndInstall()
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    }

    if (getAutoUpdate()) {
      await install()
      return NONE
    }

    return { status: "available", version: update.version, install }
  } catch (err) {
    // Never let a failed update check break app startup.
    console.error("update check failed", err)
    return NONE
  }
}
