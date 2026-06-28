import { useSyncExternalStore } from "react"
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

/** Runs the update check once per session and publishes the result. */
export function startUpdateCheck(): void {
  if (started) return
  started = true
  void checkForUpdates().then((next) => {
    state = next
    emit()
  })
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
