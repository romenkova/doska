import { useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { emit } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { BLUR_EVENT, CHANGED_EVENT } from "./quick-note-event"

interface Handlers {
  onShow: () => void
  onClose: () => void
  onNew: () => void
}

export const hideWindow = () => invoke("hide_quick_note")

/** Tells the main window its query cache is behind. */
export const announceChange = () => emit(CHANGED_EVENT)

/** Everything the popup window itself reports: focus, blur, and its two keys. */
export function useQuickNoteWindow(handlers: Handlers) {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    document.documentElement.classList.add("quick-note")
    return () => document.documentElement.classList.remove("quick-note")
  }, [])

  useEffect(() => {
    const win = getCurrentWindow()
    let cancelled = false
    const stops: (() => void)[] = []
    void Promise.all([
      win.onFocusChanged(({ payload }) => {
        if (payload) latest.current.onShow()
      }),
      win.listen(BLUR_EVENT, () => latest.current.onClose()),
    ]).then((fns) => {
      if (cancelled) fns.forEach((stop) => stop())
      else stops.push(...fns)
    })
    return () => {
      cancelled = true
      stops.forEach((stop) => stop())
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Unhandled, Escape falls through to the panel and macOS beeps.
      if (e.key === "Escape") {
        e.preventDefault()
        latest.current.onClose()
      }
      if (e.key === "n" && e.metaKey) {
        e.preventDefault()
        latest.current.onNew()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
