import { isDesktop } from "./api/runtime"

// Set once we've asked, so a declined prompt isn't re-raised on every load.
const ASKED_KEY = "deck:storage-persist-asked"

/**
 * Asks the browser to exempt this origin from storage eviction. Boards live
 * only in IndexedDB, so eviction under storage pressure is data loss rather
 * than a cache miss.
 *
 * Chrome decides silently from engagement and install heuristics; Firefox
 * raises a permission prompt. Either way we ask at most once per browser — a
 * denial is remembered, and a grant makes `persisted()` short-circuit us.
 *
 * No-ops in the Tauri webview, whose storage the OS never evicts.
 */
export async function requestPersistentStorage(): Promise<void> {
  if (isDesktop() || !navigator.storage?.persist) return
  try {
    if (await navigator.storage.persisted()) return
    if (localStorage.getItem(ASKED_KEY) === "true") return
    localStorage.setItem(ASKED_KEY, "true")
    await navigator.storage.persist()
  } catch {
    // Best-effort: a storage-policy API must never break startup.
  }
}
