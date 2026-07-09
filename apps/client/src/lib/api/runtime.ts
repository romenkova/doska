// Runtime environment + remote-sync config. The app is local-first (IndexedDB,
// no server); remote sync is opt-in.

const SERVER_URL_KEY = "deck:server-url"
const AUTO_UPDATE_KEY = "deck:auto-update"

/** True inside the packaged Tauri webview. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Alias: the sync-config setter emits on this same signal, and the sync facade
// rebuilds its engines when it fires.
export const subscribeSyncConfig = subscribeServerUrl

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) ?? ""
}

export function setServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) localStorage.setItem(SERVER_URL_KEY, trimmed)
  else localStorage.removeItem(SERVER_URL_KEY)
  emit()
}

// The server is same-origin on web (always configured) but needs an explicit
// URL on desktop.
export function isSyncConfigured(): boolean {
  return !isDesktop() || getServerUrl() !== ""
}

const autoUpdateListeners = new Set<() => void>()

export function subscribeAutoUpdate(listener: () => void): () => void {
  autoUpdateListeners.add(listener)
  return () => autoUpdateListeners.delete(listener)
}

// Defaults to off so a self-hosted setup is never updated ahead of its server.
export function getAutoUpdate(): boolean {
  return localStorage.getItem(AUTO_UPDATE_KEY) === "true"
}

export function setAutoUpdate(on: boolean): void {
  localStorage.setItem(AUTO_UPDATE_KEY, on ? "true" : "false")
  for (const listener of autoUpdateListeners) listener()
}

// Pins desktop updates to the server's release line; null if unreachable.
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

// Same origin on web, the configured URL on desktop.
function apiBase(): string {
  return isDesktop() ? getServerUrl() : window.location.origin
}

export function apiUrl(path: string): string {
  return `${apiBase()}${path}`
}

/**
 * `fetch` for API calls. On desktop, routes through Tauri's HTTP plugin so
 * requests run in Rust — bypassing the webview's CORS and using a native cookie
 * jar, which keeps session-cookie auth working. Platform `fetch` on web.
 */
export const appFetch: typeof fetch = async (input, init) => {
  if (isDesktop()) {
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http")
    return tauriFetch(input, init)
  }
  return globalThis.fetch(input, init)
}
