import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { useHistory, type HistoryEntry } from "@doska/core"
import { HistoryList } from "./history-list"

const TITLES: Record<HistoryEntry["entityType"], string> = {
  card: "Card history",
  column: "Column history",
  board: "Board history",
}

interface IProps {
  entityType: HistoryEntry["entityType"]
  entityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryModal({
  entityType,
  entityId,
  open,
  onOpenChange,
}: IProps) {
  const { data: entries } = useHistory(entityId, open)

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>
          {TITLES[entityType]}
        </ModalHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto py-4">
          {entries && <HistoryList entries={entries} />}
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
