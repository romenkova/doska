// Remote-sync config. The app is local-first (IndexedDB, no server); remote
// sync is opt-in.

import { isDesktop } from "../platform"
import { appFetch } from "./fetch"

const SERVER_URL_KEY = "deck:server-url"

const listeners = new Set<() => void>()

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
  for (const listener of listeners) listener()
}

// The server is same-origin on web (always configured) but needs an explicit
// URL on desktop.
export function isSyncConfigured(): boolean {
  return !isDesktop() || getServerUrl() !== ""
}

// Same origin on web, the configured URL on desktop.
function apiBase(): string {
  return isDesktop() ? getServerUrl() : window.location.origin
}

export function apiUrl(path: string): string {
  return `${apiBase()}${path}`
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
