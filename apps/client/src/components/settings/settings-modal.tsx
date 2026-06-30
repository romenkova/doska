import { Button, Modal, ModalContent, ModalTitle } from "@doska/ui-kit"
import { DesktopUpdatesSection } from "./sections/desktop-updates"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <div className="flex flex-col gap-4 p-6">
          <ModalTitle>Settings</ModalTitle>
          <DesktopUpdatesSection />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
