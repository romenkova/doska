import { useSyncExternalStore } from "react"
import { registerServiceWorker } from "./pwa"
import { checkForUpdates, type UpdateState } from "./updates"

// Shared result of the startup update check, so multiple parts of the UI (the
// install banner, the sidebar version label) react to the same state without
// each running its own check.

let state: UpdateState = { status: "none" }
let started = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function set(next: UpdateState) {
  state = next
  emit()
}

/**
 * Runs the update check once per session and publishes the result. Exactly one
 * of the two sources can fire: the Tauri updater on desktop, the service worker
 * on web.
 */
export function startUpdateCheck(): void {
  if (started) return
  started = true
  void checkForUpdates().then(set)
  registerServiceWorker((install) =>
    set({ status: "available", kind: "web", install })
  )
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Subscribe to the shared update state (kicks off the check on first use). */
export function useUpdateState(): UpdateState {
  startUpdateCheck()
  return useSyncExternalStore(subscribe, () => state)
}
