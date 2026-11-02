import type { ReactNode } from "react"
import { cn } from "@doska/ui-kit"

interface IProps {
  /** Omitted where the page around the board owns its top bar. */
  header?: ReactNode
  /** The columns. */
  children: ReactNode
  isLoading?: boolean
  /** Suppresses snapping, which fights a drag in progress. */
  isDragging?: boolean
  /** Pinned to the bottom-right corner — the sync indicator, where there is one. */
  footer?: ReactNode
}

/** The board: a header over a horizontal row of columns. */
export function BoardView({
  header,
  children,
  isLoading,
  isDragging,
  footer,
}: IProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {header}
      <div
        className={cn(
          "min-h-0 w-full flex-1 overflow-auto overscroll-contain px-0 xs:px-6",
          !isDragging &&
            !isLoading &&
            "snap-x snap-mandatory scroll-px-0 xs:scroll-px-6 md:snap-none",
          "transition-opacity duration-1000",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex min-h-full items-stretch gap-0 xs:gap-6">
          {children}
        </div>
      </div>
      {footer && <div className="absolute right-4 bottom-4 z-50">{footer}</div>}
    </div>
  )
}
