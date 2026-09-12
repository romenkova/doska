/**
 * Publishes the visual viewport's height as `--app-height`.
 *
 * On iOS `height: 100%` resolves against the *large* viewport, so with the
 * keyboard up the document stays taller than the screen.
 *
 * Touch only: on desktop `visualViewport.height` also tracks pinch-zoom, where
 * shrinking the app is exactly wrong.
 */
const CLAMP_MS = 400

export function trackAppHeight(): void {
  const viewport = window.visualViewport
  if (!viewport || !window.matchMedia("(pointer: coarse)").matches) return

  let clampUntil = 0

  const clamp = () => {
    if (viewport.scale > 1) return
    if (viewport.offsetTop) window.scrollTo(0, 0)
    if (performance.now() < clampUntil) requestAnimationFrame(clamp)
  }

  const apply = () => {
    document.documentElement.style.setProperty(
      "--app-height",
      `${viewport.height}px`
    )
    clampUntil = performance.now() + CLAMP_MS
    clamp()
  }

  apply()
  viewport.addEventListener("resize", apply)
  viewport.addEventListener("scroll", apply)
}
