import { isDesktop } from "./api/runtime"

// Checks the configured update endpoint (see src-tauri/tauri.conf.json), and if
// a newer signed build exists, downloads + installs it and relaunches. No-op on
// web. The Tauri update plugins are dynamically imported so they stay out of the
// web bundle entirely.
export async function checkForUpdates(): Promise<void> {
  if (!isDesktop()) return
  try {
    const { check } = await import("@tauri-apps/plugin-updater")
    const update = await check()
    if (!update) return

    await update.downloadAndInstall()

    // Install is applied on the next launch — relaunch now to pick it up.
    // Local data lives in IndexedDB and survives the restart.
    const { relaunch } = await import("@tauri-apps/plugin-process")
    await relaunch()
  } catch (err) {
    // Never let a failed update check break app startup.
    console.error("update check failed", err)
  }
}
