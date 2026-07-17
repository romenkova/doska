import {
  CardContent,
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
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
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Reorder columns
        </ModalHeader>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <ModalDescription>
              Drag a column to change its place on the board.
            </ModalDescription>
            <ReorderColumnsDNDContainer
              columns={columns}
              onReorder={onReorder}
            />
          </div>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
