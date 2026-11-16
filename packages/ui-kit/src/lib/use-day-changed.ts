import { useSyncExternalStore } from "react"
import { todayIso } from "@doska/utils"

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000)
  document.addEventListener("visibilitychange", onChange)
  return () => {
    clearInterval(id)
    document.removeEventListener("visibilitychange", onChange)
  }
}

/** Re-renders the caller when the local date rolls over. */
export function useDayChanged(): void {
  useSyncExternalStore(subscribe, todayIso)
}
