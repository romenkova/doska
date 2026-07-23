import { isDesktop } from "./platform"

/**
 * Registers the service worker that precaches the app shell, so the web client
 * loads with no network — matching the local-first IndexedDB store behind it.
 *
 * Calls `onUpdate` when a new build has been fetched and is waiting to take
 * over. Installing it activates the waiting worker and reloads the page.
 *
 * No-ops inside the Tauri webview (which ships its own bundle and updater) and
 * in dev, where the precache would just serve stale modules.
 */
export function registerServiceWorker(
  onUpdate: (install: () => Promise<void>) => void
): void {
  if (isDesktop() || !import.meta.env.PROD) return
  if (!("serviceWorker" in navigator)) return

  void import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () =>
        onUpdate(async () => {
          void updateSW(true)
          setTimeout(() => location.reload(), 1500)
        }),
    })
  })
}
