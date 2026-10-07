import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { useActivity } from "@doska/core"
import { HistoryList } from "./history-list"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryFeedModal({ open, onOpenChange }: IProps) {
  const { data: entries } = useActivity(open)

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>History</ModalHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto py-4">
          {entries && <HistoryList entries={entries} />}
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
