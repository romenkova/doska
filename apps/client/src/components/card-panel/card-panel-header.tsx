import { Button, cn, useIsMobile } from "@doska/ui-kit"
import { Eye, PencilLine, X } from "lucide-react"
import type { ReactNode } from "react"
import { hasOverlayTitleBar } from "@/lib/platform"
import { useIsFullscreen } from "@/lib/hooks"

interface IProps {
  onClose: () => void
  /** Omit where the card cannot be edited — the toggle has nothing to toggle to. */
  onTogglePreivew?: () => void
  inWindow?: boolean
  isPreview: boolean
  actions?: ReactNode
  /** The card's "⋯" menu, pinned to the far right of the row. */
  menu?: ReactNode
  /** Task progress, deadline, priority — and the column beside them. */
  meta?: ReactNode
}

export function CardPanelHeader({
  onClose,
  isPreview,
  onTogglePreivew,
  inWindow,
  actions,
  menu,
  meta,
}: IProps) {
  const isMobile = useIsMobile()
  const isFullscreen = useIsFullscreen()
  const windowControlsInset = isMobile && hasOverlayTitleBar() && !isFullscreen

  return (
    <div
      // The header is the tear-off handle, so it must not drag the OS window.
      data-no-drag
      data-tear-handle
      className={cn(
        "flex shrink-0 items-center justify-between gap-2",
        !inWindow && "border-b",
        "px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2",
        windowControlsInset && "pl-24"
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {!inWindow && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close card"
            onClick={onClose}
          >
            <X />
          </Button>
        )}
        {/* The chips shrink themselves on wider screens; here they have to
            match the header buttons instead. */}
        <div className="flex min-w-0 items-center gap-4 [&_svg]:size-4!">
          {meta}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {actions}
        {onTogglePreivew && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isPreview ? "Edit" : "Preview"}
            onClick={onTogglePreivew}
          >
            {isPreview ? <PencilLine /> : <Eye />}
          </Button>
        )}
        {menu}
      </div>
    </div>
  )
}
