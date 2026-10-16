import { Modal, ModalContent, ModalTitle } from "@doska/ui-kit"
import { SyncSetup } from "./sync-setup"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Set-up-sync dialog.
 */
export function LoginModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <div className="flex flex-col gap-4 p-6">
          <ModalTitle>Sign in</ModalTitle>
          {/* Keyed on `open` so the form state resets each time it's opened. */}
          <SyncSetup
            key={String(open)}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}
