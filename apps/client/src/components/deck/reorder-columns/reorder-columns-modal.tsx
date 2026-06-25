import {
  Button,
  Modal,
  ModalContent,
  ModalContentCentered,
  ModalDescription,
  ModalTitle,
} from "@doska/ui-kit"
import type { Column } from "@/lib/types"
import { ReorderColumnsDNDContainer } from "./reorder-cols-dnd"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: Column[]
  onReorder: (changed: Column[]) => void
}

export function ReorderColumnsModal({
  open,
  onOpenChange,
  columns,
  onReorder,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:p-6">
        <ModalContentCentered>
          <div className="flex flex-col gap-1">
            <ModalTitle>Reorder columns</ModalTitle>
            <ModalDescription>
              Drag a column to change its place on the board.
            </ModalDescription>
          </div>

          <div className="mt-4">
            <ReorderColumnsDNDContainer
              columns={columns}
              onReorder={onReorder}
            />
          </div>

          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </ModalContentCentered>
      </ModalContent>
    </Modal>
  )
}
