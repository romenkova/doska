import {
  Button,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@doska/ui-kit"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
}

/** A small "are you sure?" modal for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm md:p-6">
        <div className="flex flex-1 flex-col justify-center gap-2 p-6 md:flex-none md:p-0">
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
