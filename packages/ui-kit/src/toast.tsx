import { AnimatePresence, motion } from "motion/react"
import type { ReactNode } from "react"
import { cn } from "./lib/cn"

interface ToastProps {
  visible: boolean
  className?: string
  children: ReactNode
}

export function Toast({ visible, className, children }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="status"
          className={cn(
            "flex items-center gap-2 px-4 py-2",
            "rounded-xl border bg-popover text-sm text-popover-foreground shadow-e3",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
