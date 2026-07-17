import { useLayoutEffect, useRef } from "react"

/**
 * FLIP for cards inside @hello-pangea/dnd. When a card lands in a new slot
 * between renders, slide it from where it was instead of letting it jump.
 *
 * Two elements are kept apart on purpose: `setOuter` marks the draggable slot —
 * dnd owns its transform during a drag, so we only read its `offsetTop`/`Left`
 * (layout position, unchanged by drag transforms or scrolling). `setInner` marks
 * a wrapper we alone control; the slide transform goes there, so it never
 * collides with dnd.
 *
 * Pass `active: false` while a drag is in progress — dnd animates the reflow and
 * the drop, so we sit out and don't animate the commit right after either.
 */
export function useFlip(active: boolean) {
  const outer = useRef<HTMLElement | null>(null)
  const inner = useRef<HTMLElement | null>(null)
  const prev = useRef<{ top: number; left: number } | null>(null)
  const wasActive = useRef(false)

  useLayoutEffect(() => {
    const outerEl = outer.current
    const innerEl = inner.current
    if (!outerEl || !innerEl) return

    const next = { top: outerEl.offsetTop, left: outerEl.offsetLeft }
    const last = prev.current
    const animatable = active && wasActive.current && last
    prev.current = next
    wasActive.current = active
    if (!animatable) return

    const dx = last.left - next.left
    const dy = last.top - next.top
    if (!dx && !dy) return

    // Pin to the old spot before paint, release next frame so CSS tweens it.
    innerEl.style.transition = "none"
    innerEl.style.transform = `translate(${dx}px, ${dy}px)`
    requestAnimationFrame(() => {
      innerEl.style.transition = "transform 220ms cubic-bezier(0.2, 0, 0, 1)"
      innerEl.style.transform = "translate(0px, 0px)"
    })
  })

  return {
    setOuter: (el: HTMLElement | null) => {
      outer.current = el
    },
    setInner: (el: HTMLElement | null) => {
      inner.current = el
    },
  }
}
