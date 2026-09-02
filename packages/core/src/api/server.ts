// Remote-sync config. The app is local-first (IndexedDB, no server); remote
// sync is opt-in.

import { runtime } from "../runtime"
import { appFetch } from "./fetch"

const SERVER_URL_KEY = "deck:server-url"

const urlListeners = new Set<() => void>()

export function subscribeServerUrl(listener: () => void): () => void {
  urlListeners.add(listener)
  return () => urlListeners.delete(listener)
}

/**
 * Where the sync server lives, as the user configured it. Empty on platforms
 * that have an origin to fall back on (web) and until the sign-in screen sets
 * it anywhere else, where empty means the app runs purely local.
 */
export function getServerUrl(): string {
  return runtime().kv.get(SERVER_URL_KEY) ?? ""
}

export function setServerUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) runtime().kv.set(SERVER_URL_KEY, trimmed)
  else runtime().kv.remove(SERVER_URL_KEY)
  for (const listener of urlListeners) listener()
}

export function subscribeSyncConfig(listener: () => void): () => void {
  return runtime().http.subscribe(listener)
}

export function isSyncConfigured(): boolean {
  return runtime().http.isConfigured()
}

export function apiUrl(path: string): string {
  return runtime().http.url(path)
}

export function apiUrlDomain(): string {
  const base = apiUrl("")
  try {
    return new URL(base).host
  } catch {
    return base
  }
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
