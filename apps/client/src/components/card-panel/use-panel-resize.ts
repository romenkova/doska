import { useEffect, useState } from "react"

/** localStorage key holding the card panel's width, in pixels. */
const WIDTH_KEY = "deck.cardPanelWidth"

const DEFAULT_WIDTH = 448
const MIN_WIDTH = 320
const MAX_WIDTH = 880

/** Keeps the board usable no matter how far the handle is dragged. */
const MIN_BOARD_WIDTH = 360

/**
 * Distance from the viewport's right edge to the pane (the wrapper's `p-2`), plus
 * half the 8px handle strip — so the pill sits under the pointer, not beside it.
 */
const POINTER_OFFSET = 8 + 4

function clampWidth(width: number) {
  const room = window.innerWidth - MIN_BOARD_WIDTH
  const max = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, room))
  return Math.round(Math.max(MIN_WIDTH, Math.min(max, width)))
}

function readStoredWidth() {
  const stored = Number(localStorage.getItem(WIDTH_KEY))
  return stored > 0 ? stored : DEFAULT_WIDTH
}

/**
 * Drag-to-resize for the card panel. The panel is flush against the right edge,
 * so the pointer's distance from that edge *is* the width — no drag origin needed.
 */
export function usePanelResize() {
  const [width, setWidth] = useState(() => clampWidth(readStoredWidth()))
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!isResizing) return

    const onPointerMove = (e: PointerEvent) => {
      setWidth(clampWidth(window.innerWidth - e.clientX - POINTER_OFFSET))
    }
    const stop = () => setIsResizing(false)

    // The pointer spends the drag over the board, which would otherwise select text.
    const { userSelect, cursor } = document.body.style
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", stop)
    window.addEventListener("pointercancel", stop)
    return () => {
      document.body.style.userSelect = userSelect
      document.body.style.cursor = cursor
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
    }
  }, [isResizing])

  useEffect(() => {
    if (isResizing) return
    localStorage.setItem(WIDTH_KEY, String(width))
  }, [isResizing, width])

  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return {
    width,
    isResizing,
    startResizing: () => setIsResizing(true),
    resetWidth: () => setWidth(clampWidth(DEFAULT_WIDTH)),
  }
}
