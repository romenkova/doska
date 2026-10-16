import { cn, Modal, ModalContent } from "@doska/ui-kit"
import { useRef, type ReactNode } from "react"
import { useTearOff } from "./use-tear-off"
import type { DropPoint } from "@/components/card-window/open-card-window"

interface IProps {
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  onTearOff?: (at: DropPoint) => void
  children: ReactNode
}

/** The card as a centered modal vs panel. */
export function CardModalShell({
  isOpen,
  onClose,
  onClosed,
  onTearOff,
  children,
}: IProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const tearOff = useTearOff(onTearOff)

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      onOpenChangeComplete={(open) => {
        if (!open) onClosed()
      }}
    >
      <ModalContent
        ref={popupRef}
        initialFocus={popupRef}
        aria-label="Card"
        onMouseDown={tearOff.onMouseDown}
        className={cn(
          "overflow-hidden outline-none md:h-[85svh] md:max-w-3xl",
          onTearOff && "[&_[data-tear-handle]]:cursor-grab",
          tearOff.isOutside && "opacity-40"
        )}
      >
        {children}
      </ModalContent>
    </Modal>
  )
}
