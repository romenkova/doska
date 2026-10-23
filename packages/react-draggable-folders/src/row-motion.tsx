import { motion } from "motion/react"
import type { ReactNode } from "react"

const REORDER_TRANSITION = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const

/** Slides rows into their new places after a drop; the drag library moves them during one. */
export function RowMotion({
  dragging,
  children,
}: {
  dragging: boolean
  children: ReactNode
}) {
  return (
    <motion.div
      layout={dragging ? false : "position"}
      transition={REORDER_TRANSITION}
    >
      {children}
    </motion.div>
  )
}
