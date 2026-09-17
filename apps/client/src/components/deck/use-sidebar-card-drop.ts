import { useEffect, useState } from "react"
import {
  useCardDrop,
  type CardDropTarget,
} from "@/providers/card-drop/card-drop-context"

const BOUNCE: Keyframe[] = [
  { scale: 1 },
  { scale: 1.05, offset: 0.3 },
  { scale: 0.98, offset: 0.6 },
  { scale: 1 },
]

/**
 * Follows the pointer while a card is dragged
 */
export function useSidebarCardDrop(dragging: boolean) {
  const { target, setTarget } = useCardDrop()
  const [overSidebar, setOverSidebar] = useState(false)

  useEffect(() => {
    if (!dragging) return
    const onPointerMove = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY)
      setOverSidebar(element?.closest('[data-slot="sidebar"]') !== null)
      const next = targetUnder(element)
      setTarget((current) => (sameTarget(next, current) ? current : next))
    }
    window.addEventListener("pointermove", onPointerMove)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      setTarget(null)
      setOverSidebar(false)
    }
  }, [dragging, setTarget])

  return {
    overSidebar,
    landing: target?.kind === "board",
    takeDrop: () => {
      if (target?.kind !== "board") return null
      document
        .querySelector(`[data-drop-board="${target.id}"]`)
        ?.animate(BOUNCE, { duration: 350, easing: "ease-out" })
      return target.id
    },
  }
}

function targetUnder(element: Element | null): CardDropTarget | null {
  const row = element?.closest<HTMLElement>(
    "[data-drop-board],[data-drop-folder]"
  )
  if (!row) return null
  const { dropBoard, dropFolder } = row.dataset
  if (dropBoard) return { kind: "board", id: dropBoard }
  if (dropFolder) return { kind: "folder", id: dropFolder }
  return null
}

function sameTarget(a: CardDropTarget | null, b: CardDropTarget | null) {
  if (a === null || b === null) return a === b
  return a.kind === b.kind && a.id === b.id
}
