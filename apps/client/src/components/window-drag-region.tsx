import { useEffect } from "react"
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import { isDesktop } from "@/lib/api/runtime"

/** Height of the draggable strip in px. */
const DRAG_STRIP_HEIGHT = 100

/** Drag detection threshold */
const DRAG_THRESHOLD = 4

/**
 * Makes the top strip of the window drag the OS window
 */
export function WindowDragRegion() {
  useEffect(() => {
    if (!isDesktop()) return

    // Resolve the window up front so the move handler can start dragging
    // synchronously, without an async import racing the gesture.
    let win: WebviewWindow | null = null
    let cancelled = false
    void import("@tauri-apps/api/webviewWindow").then(
      ({ getCurrentWebviewWindow }) => {
        if (!cancelled) win = getCurrentWebviewWindow()
      }
    )

    // Once a drag hands off to the OS, the browser still synthesises one `click`
    // when the button is released. We can't time how long the drag lasts, so we
    // arm a flag and let a persistent capture-phase handler eat the next click.
    let armed = false

    // Force the plain arrow cursor while the window is being dragged, overriding
    // whatever cursor the element under the pointer would otherwise show.
    let cursorStyle: HTMLStyleElement | null = null
    function forceDefaultCursor(on: boolean) {
      if (on && !cursorStyle) {
        cursorStyle = document.createElement("style")
        cursorStyle.textContent = "*{cursor:default !important}"
        document.head.appendChild(cursorStyle)
      } else if (!on && cursorStyle) {
        cursorStyle.remove()
        cursorStyle = null
      }
    }

    function onMouseDown(e: MouseEvent) {
      // A fresh press means any pending suppression is stale — a click that
      // never arrived must not swallow this gesture's click.
      armed = false
      forceDefaultCursor(false)
      if (!win || e.button !== 0 || e.clientY > DRAG_STRIP_HEIGHT) return
      const el = e.target as HTMLElement
      if (el.closest("[data-no-drag]")) return
      // Let an already-focused text field be dragged for text selection; the
      // first click still focuses it (no movement = no drag).
      const field = el.closest("input, textarea")
      if (field && field === document.activeElement) return

      const startX = e.clientX
      const startY = e.clientY

      function onMove(ev: MouseEvent) {
        if (
          Math.abs(ev.clientX - startX) < DRAG_THRESHOLD &&
          Math.abs(ev.clientY - startY) < DRAG_THRESHOLD
        )
          return
        cleanup()
        armed = true
        forceDefaultCursor(true)
        void win?.startDragging()
      }

      function cleanup() {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", cleanup)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", cleanup)
    }

    function onClickCapture(ev: MouseEvent) {
      if (!armed) return
      armed = false
      ev.stopPropagation()
      ev.preventDefault()
    }

    // Drag released — restore normal cursors.
    function onMouseUp() {
      forceDefaultCursor(false)
    }

    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("click", onClickCapture, true)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      cancelled = true
      forceDefaultCursor(false)
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("click", onClickCapture, true)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  return null
}
