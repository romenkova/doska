/**
 * Runtime environment + remote-sync configuration.
 *
 * The app is local-first: it runs entirely on IndexedDB with no server. Remote
 * sync is opt-in.
 */

const SERVER_URL_KEY = "deck:server-url"
const AUTO_UPDATE_KEY = "deck:auto-update"
const SYNC_TARGET_KEY = "deck:sync:target"
const SYNC_FOLDER_KEY = "deck:sync:folder"

/** Where local changes sync to: the remote server, or a local Markdown folder. */
export type SyncTarget = "server" | "folder"

/** True inside the packaged Tauri webview. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Subscribe to server-URL changes (shaped for `useSyncExternalStore`). */
export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Subscribe to any sync-configuration change — backend target, folder, or
 * server URL. Same underlying signal as {@link subscribeServerUrl}; named for
 * the sync facade, which rebuilds its engines when this fires.
 */
export const subscribeSyncConfig = subscribeServerUrl

/** The configured remote server URL (desktop only). Empty when unset. */
export function getServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) ?? ""
}

/** Persists the remote server URL, trimming any trailing slash. */
export function setServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) localStorage.setItem(SERVER_URL_KEY, trimmed)
  else localStorage.removeItem(SERVER_URL_KEY)
  emit()
}

/**
 * The active sync backend. Defaults to `server`; the `folder` backend is
 * desktop-only and opt-in (see {@link setSyncTarget}).
 */
export function getSyncTarget(): SyncTarget {
  return localStorage.getItem(SYNC_TARGET_KEY) === "folder" ? "folder" : "server"
}

/** Switches the sync backend and notifies subscribers so sync can rebuild. */
export function setSyncTarget(target: SyncTarget): void {
  localStorage.setItem(SYNC_TARGET_KEY, target)
  emit()
}

/** The folder the `folder` backend mirrors to (absolute path). Empty when unset. */
export function getSyncFolder(): string {
  return localStorage.getItem(SYNC_FOLDER_KEY) ?? ""
}

/** Persists the sync folder and notifies subscribers. */
export function setSyncFolder(path: string): void {
  const trimmed = path.trim()
  if (trimmed) localStorage.setItem(SYNC_FOLDER_KEY, trimmed)
  else localStorage.removeItem(SYNC_FOLDER_KEY)
  emit()
}

/**
 * Whether the active backend has somewhere to reach. The `folder` backend needs
 * a chosen folder (desktop only); the `server` backend is same-origin on web
 * (always configured) and needs an explicit URL on desktop.
 */
export function isSyncConfigured(): boolean {
  if (getSyncTarget() === "folder") return isDesktop() && getSyncFolder() !== ""
  return !isDesktop() || getServerUrl() !== ""
}

const autoUpdateListeners = new Set<() => void>()

/** Subscribe to auto-update preference changes (for `useSyncExternalStore`). */
export function subscribeAutoUpdate(listener: () => void): () => void {
  autoUpdateListeners.add(listener)
  return () => autoUpdateListeners.delete(listener)
}

/**
 * Whether the desktop app installs matching updates automatically. Opt-in:
 * defaults to off so a self-hosted setup is never updated ahead of its server
 * without the user choosing to.
 */
export function getAutoUpdate(): boolean {
  return localStorage.getItem(AUTO_UPDATE_KEY) === "true"
}

/** Persists the auto-update preference and notifies subscribers. */
export function setAutoUpdate(on: boolean): void {
  localStorage.setItem(AUTO_UPDATE_KEY, on ? "true" : "false")
  for (const listener of autoUpdateListeners) listener()
}

/**
 * The configured sync server's version, or null if unreachable/unconfigured.
 * Used to pin desktop updates to the server's release line.
 */
export async function getServerVersion(): Promise<string | null> {
  try {
    const res = await appFetch(apiUrl("/api/version"))
    if (!res.ok) return null
    const body = (await res.json()) as { version?: unknown }
    return typeof body.version === "string" ? body.version : null
  } catch {
    return null
  }
}

/** Absolute API base: same origin on web, the configured URL on desktop. */
function apiBase(): string {
  return isDesktop() ? getServerUrl() : window.location.origin
}

/** Builds an absolute API URL for the current runtime. */
export function apiUrl(path: string): string {
  return `${apiBase()}${path}`
}

/**
 * `fetch` for API calls. On desktop, requests go through Tauri's HTTP plugin so
 * they run in Rust — bypassing the webview's CORS and using a native cookie jar,
 * which keeps the existing session-cookie auth working unchanged. On web it's
 * the platform `fetch`.
 */
export const appFetch: typeof fetch = async (input, init) => {
  if (isDesktop()) {
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http")
    return tauriFetch(input, init)
  }
  return globalThis.fetch(input, init)
}
