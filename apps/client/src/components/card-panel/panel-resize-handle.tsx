import { cn } from "@doska/ui-kit"

interface IProps {
  isResizing: boolean
  onStartResizing: () => void
  onResetWidth: () => void
}

export function PanelResizeHandle({
  isResizing,
  onStartResizing,
  onResetWidth,
}: IProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize card panel"
      onPointerDown={(e) => {
        e.preventDefault()
        onStartResizing()
      }}
      onDoubleClick={onResetWidth}
      className={cn(
        // Must span the gutter exactly, or the pill sits off-centre.
        "absolute inset-y-0 left-0 z-20 hidden w-2 md:block",
        "cursor-col-resize touch-none",
        "after:absolute after:inset-y-10 after:left-1/2 after:w-1",
        "after:-translate-x-1/2 after:rounded-full after:bg-primary/50",
        "after:opacity-0 after:transition-opacity",
        isResizing ? "after:opacity-100" : "hover:after:opacity-100"
      )}
    />
  )
}
