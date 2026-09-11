import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { useTheme } from "@/providers/theme/theme-context"
import type { DropPoint } from "@/components/card-window/open-card-window"

const DRAG_THRESHOLD = 4

function isOutsideViewport(e: MouseEvent) {
  return (
    e.clientX < 0 ||
    e.clientY < 0 ||
    e.clientX > window.innerWidth ||
    e.clientY > window.innerHeight
  )
}

/**
 * Drop-to-detach: drag the panel's handle past the window's edge
 */
export function useTearOff(onTearOff: ((at: DropPoint) => void) | undefined) {
  const [isOutside, setOutside] = useState(false)
  const { theme } = useTheme()

  function onMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (!onTearOff || e.button !== 0) return
    const target = e.target as HTMLElement
    if (!target.closest("[data-tear-handle]")) return
    if (target.closest("button, a, input, textarea, [role=menu]")) return

    // Stops the browser starting a text selection
    e.preventDefault()

    const rect = e.currentTarget.getBoundingClientRect()
    const grab = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const start = { x: e.clientX, y: e.clientY }
    const style = document.body.style
    const saved = { userSelect: style.userSelect, cursor: style.cursor }
    let dragging = false

    function onMove(ev: MouseEvent) {
      if (!dragging) {
        if (
          Math.abs(ev.clientX - start.x) < DRAG_THRESHOLD &&
          Math.abs(ev.clientY - start.y) < DRAG_THRESHOLD
        )
          return
        dragging = true
        // The pointer drags across the card's own text, which would otherwise
        // select it — and anything selected before the threshold has to go too.
        window.getSelection()?.removeAllRanges()
        style.userSelect = "none"
        style.cursor = "grabbing"
        void invoke("start_tear_off", { theme })
      }
      setOutside(isOutsideViewport(ev))
    }

    function onUp(ev: MouseEvent) {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      if (!dragging) return
      style.userSelect = saved.userSelect
      style.cursor = saved.cursor
      setOutside(false)
      void invoke("end_tear_off")
      if (isOutsideViewport(ev)) {
        onTearOff?.({ x: ev.screenX - grab.x, y: ev.screenY - grab.y })
      }
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  return { isOutside, onMouseDown }
}
