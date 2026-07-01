import { useEffect } from "react"

const EDGE_ZONE = 24 // px from the left edge where a swipe may start
const THRESHOLD = 60 // px of horizontal travel needed to fire

/** Fires `onSwipe` on a rightward swipe starting from the left screen edge. */
export function useEdgeSwipe(enabled: boolean, onSwipe: () => void) {
  useEffect(() => {
    if (!enabled) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onStart = ({ touches }: TouchEvent) => {
      startX = touches[0]?.clientX ?? 0
      startY = touches[0]?.clientY ?? 0
      tracking = startX <= EDGE_ZONE
    }

    const onMove = ({ touches }: TouchEvent) => {
      if (!tracking || !touches[0]) return
      const dx = touches[0].clientX - startX
      const dy = touches[0].clientY - startY
      if (dx > THRESHOLD && dx > Math.abs(dy)) {
        tracking = false
        onSwipe()
      }
    }

    const stop = () => {
      tracking = false
    }

    const opts = { passive: true } as const
    window.addEventListener("touchstart", onStart, opts)
    window.addEventListener("touchmove", onMove, opts)
    window.addEventListener("touchend", stop, opts)
    window.addEventListener("touchcancel", stop, opts)
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", stop)
      window.removeEventListener("touchcancel", stop)
    }
  }, [enabled, onSwipe])
}
