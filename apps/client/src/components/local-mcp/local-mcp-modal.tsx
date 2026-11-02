import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { LocalMcpPanel } from "./local-mcp-panel"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocalMcpModal({ open, onOpenChange }: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>Local MCP</ModalHeader>
        <CardContent className="overflow-y-auto py-4">
          <LocalMcpPanel />
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
