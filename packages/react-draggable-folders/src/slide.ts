const SLIDE: KeyframeAnimationOptions = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
}

export function measureTops(elements: Map<string, HTMLElement>) {
  const tops = new Map<string, number>()
  for (const [id, element] of elements) {
    tops.set(id, element.getBoundingClientRect().top)
  }
  return tops
}

/** Slides each row from its measured top to where it sits now. */
export function slideFrom(
  elements: Map<string, HTMLElement>,
  tops: Map<string, number>
) {
  for (const [id, element] of elements) {
    const top = tops.get(id)
    if (top === undefined) continue
    const offset = top - element.getBoundingClientRect().top
    if (Math.abs(offset) < 1) continue
    element.animate(
      [{ transform: `translateY(${offset}px)` }, { transform: "none" }],
      SLIDE
    )
  }
}
