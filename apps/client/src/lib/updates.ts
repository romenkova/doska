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

// Checks the configured update endpoint (see src-tauri/tauri.conf.json) for a
// newer signed build. Updates are pinned to the sync server's release line: if a
// server is configured, we only offer a release whose major.minor matches the
// server's version, so the client never runs ahead of a (possibly self-hosted)
// server it can't talk to. When auto-update is on, a matching update installs
// and relaunches immediately; otherwise it's returned so the UI can prompt.
// No-op on web. The Tauri update plugins are dynamically imported so they stay
// out of the web bundle entirely.
export async function checkForUpdates(): Promise<UpdateState> {
  if (!isDesktop()) return NONE
  try {
    const { check } = await import("@tauri-apps/plugin-updater")

    // Pin to the server's release line when a server is configured. We send the
    // server version to the update proxy so it serves the newest build on that
    // major.minor line (not just the overall latest), letting a client whose
    // server lags catch up to the highest compatible release instead of getting
    // nothing. With no server (official channel / not yet signed in) we skip the
    // pin and take the latest.
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
      // Install is applied on the next launch — relaunch now to pick it up.
      // Local data lives in IndexedDB and survives the restart.
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
