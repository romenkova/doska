import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { PrefixSection } from "./prefix-section"
import { DeleteSection } from "./delete-section"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefix: string
  takenPrefixes: string[]
  onRenamePrefix: (prefix: string) => void
  onRequestDelete: () => void
}

/** Per-board settings, laid out like the app's general settings modal. */
export function BoardSettingsModal({
  open,
  onOpenChange,
  prefix,
  takenPrefixes,
  onRenamePrefix,
  onRequestDelete,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Board settings
        </ModalHeader>
        <CardContent className="flex flex-col gap-6 py-4">
          {/* Remount per open so the draft starts from the current prefix. */}
          <PrefixSection
            key={prefix}
            prefix={prefix}
            taken={takenPrefixes}
            onCommit={onRenamePrefix}
          />
          <DeleteSection onDelete={onRequestDelete} />
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
