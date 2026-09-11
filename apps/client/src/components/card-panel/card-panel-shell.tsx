import { cn, useOptionalSidebar } from "@doska/ui-kit"
import { useEffect, type CSSProperties, type ReactNode } from "react"
import { PanelResizeHandle } from "./panel-resize-handle"
import { usePanelResize } from "./use-panel-resize"
import { useTearOff } from "./use-tear-off"
import type { DropPoint } from "@/components/card-window/open-card-window"

interface IProps {
  isOpen: boolean
  onClose: () => void
  /** Clears the card once the closing sweep has finished. */
  onClosed: () => void
  /** Desktop only: the panel was dragged out past the window's edge and dropped. */
  onTearOff?: (at: DropPoint) => void
  children: ReactNode
}

/** The panel itself: resizable beside the board, full-screen on a phone. */
export function CardPanelShell({
  isOpen,
  onClose,
  onClosed,
  onTearOff,
  children,
}: IProps) {
  const { width, isResizing, startResizing, resetWidth } = usePanelResize()
  const tearOff = useTearOff(onTearOff)
  const sidebarOpen = useOptionalSidebar()?.open ?? true

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      style={{ "--card-panel-width": `${width}px` } as CSSProperties}
      className={cn(
        "relative shrink-0 overflow-hidden",
        // Pinned to the *visual* viewport, not the layout one
        "max-md:fixed max-md:inset-x-0 max-md:z-50 max-md:w-full max-md:bg-card",
        "max-md:top-(--app-offset,0px) max-md:h-(--app-height,100svh)",
        "md:box-border",
        // Resizing must track the pointer, so only the open/close sweep animates.
        !isResizing &&
          "md:transition-[width,padding] md:duration-200 md:ease-linear",
        // The padding is the handle's gutter, so the width covers both.
        isOpen &&
          sidebarOpen &&
          "md:w-[calc(var(--card-panel-width)+1rem)] md:p-2",
        isOpen &&
          !sidebarOpen &&
          "md:w-[calc(var(--card-panel-width)+0.5rem)] md:pl-2",
        !isOpen && "max-md:hidden md:w-0"
      )}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !isOpen) onClosed()
      }}
    >
      {isOpen && (
        <PanelResizeHandle
          isResizing={isResizing}
          onStartResizing={startResizing}
          onResetWidth={resetWidth}
        />
      )}
      {/* `ring-inset` because the wrapper's overflow clips an outset ring's left edge. */}
      <div
        role="region"
        aria-label="Card"
        onMouseDown={tearOff.onMouseDown}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden bg-card text-sm text-card-foreground md:w-(--card-panel-width)",
          "md:transition-[border-radius,opacity] md:duration-200 md:ease-linear",
          onTearOff && "[&_[data-tear-handle]]:cursor-grab",
          tearOff.isOutside && "opacity-40",
          sidebarOpen
            ? "md:rounded-xl md:ring-1 md:ring-foreground/10 md:ring-inset"
            : "md:border-l md:border-foreground/10"
        )}
      >
        {children}
      </div>
    </div>
  )
}
