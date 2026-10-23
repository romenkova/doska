const BOUNCE: Keyframe[] = [
  { scale: 1 },
  { scale: 1.05, offset: 0.3 },
  { scale: 0.98, offset: 0.6 },
  { scale: 1 },
]

export function bounce(element: Element | null | undefined) {
  element?.animate(BOUNCE, { duration: 350, easing: "ease-out" })
}
