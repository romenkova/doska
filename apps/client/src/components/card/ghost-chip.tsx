import { Card as CardBase } from "@doska/ui-kit"
import type { DraggableProvidedDraggableProps } from "@hello-pangea/dnd"

const WIDTH = 220
const HEIGHT = 40
const POINTER_INSET = 16

interface IProps {
  /** The dragged card's box. */
  box: DraggableProvidedDraggableProps["style"]
  compact: boolean
  /** Where the card was grabbed, relative to its box. */
  grab: { x: number; y: number }
  title: string
}

/** The title chip a dragged card becomes over the sidebar. */
export function GhostChip({ box, compact, grab, title }: IProps) {
  const dragging = box && "width" in box ? box : null
  const boxWidth = dragging?.width ?? WIDTH
  const boxHeight = dragging?.height ?? HEIGHT

  const transform = compact
    ? `translate(${grab.x - POINTER_INSET}px, ${grab.y - HEIGHT / 2}px) scale(1, 1)`
    : `translate(0px, 0px) scale(${boxWidth / WIDTH}, ${boxHeight / HEIGHT})`

  return (
    <div style={box}>
      <div
        className="absolute top-0 left-0 origin-top-left transition-[transform,opacity] duration-150 ease-out will-change-transform"
        style={{
          width: WIDTH,
          height: HEIGHT,
          transform,
          opacity: compact ? 1 : 0,
        }}
      >
        <CardBase className="h-full justify-center bg-card/70 py-0 shadow-e3 backdrop-blur-md">
          <div className="truncate px-3 text-sm font-medium">
            {title || "Untitled card"}
          </div>
        </CardBase>
      </div>
    </div>
  )
}
