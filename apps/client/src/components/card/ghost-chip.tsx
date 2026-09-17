import { Card as CardBase } from "@doska/ui-kit"
import type { DraggableProvidedDraggableProps } from "@hello-pangea/dnd"
import { motion } from "motion/react"

const WIDTH = 220
const HEIGHT = 40
const POINTER_INSET = 16
const TRANSITION = { duration: 0.15, ease: "easeOut" } as const

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
  return (
    <div style={box}>
      <motion.div
        className="absolute top-0 left-0"
        initial={false}
        animate={
          compact
            ? {
                width: WIDTH,
                height: HEIGHT,
                x: grab.x - POINTER_INSET,
                y: grab.y - HEIGHT / 2,
                opacity: 1,
              }
            : { width: "100%", height: "100%", x: 0, y: 0, opacity: 0 }
        }
        transition={TRANSITION}
      >
        <CardBase className="h-full justify-center bg-card/70 py-0 shadow-e3 backdrop-blur-md">
          <div className="truncate px-3 text-sm font-medium">
            {title || "Untitled card"}
          </div>
        </CardBase>
      </motion.div>
    </div>
  )
}
