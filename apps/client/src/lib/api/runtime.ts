/**
 * Runtime environment + remote-sync configuration.
 *
 * The app is local-first: it runs entirely on IndexedDB with no server. Remote
 * sync is opt-in. On the **web** build the app is served by the API, so the
 * server is same-origin (Vite proxies `/rpc` and `/auth`) and sync is gated by
 * auth alone — behavior is unchanged. On the **desktop** (Tauri) build the
 * webview origin is `tauri://localhost`, so the user must supply an absolute
 * server URL before anything talks to the network.
 */

const SERVER_URL_KEY = "deck:server-url"

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
 * Whether remote sync has somewhere to reach. The web build is same-origin so
 * it's always configured; desktop needs an explicit server URL.
 */
export function isSyncConfigured(): boolean {
  return !isDesktop() || getServerUrl() !== ""
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
