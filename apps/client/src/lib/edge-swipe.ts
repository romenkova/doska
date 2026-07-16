import { isStandalone } from "./platform"

// Width of the band along each side where the OS takes over the gesture.
const EDGE_PX = 24

/**
 * Suppresses the back/forward swipe in an installed PWA.
 */
export function blockEdgeSwipeNavigation(): void {
  if (!isStandalone()) return

  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return
      const { clientX } = event.touches[0]
      if (clientX > EDGE_PX && clientX < window.innerWidth - EDGE_PX) return
      // Would also swallow the click this touch turns into, so interactive
      // targets in the band keep working.
      if (
        (event.target as Element | null)?.closest(
          "a, button, input, [role=button], [contenteditable]"
        )
      )
        return
      event.preventDefault()
    },
    { passive: false }
  )
}
