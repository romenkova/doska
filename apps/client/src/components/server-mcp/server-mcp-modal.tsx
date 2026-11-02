import { CardContent, Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { apiUrl } from "@doska/core"
import { CopyField } from "@/components/local-mcp/copy-field"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServerMcpModal({ open, onOpenChange }: IProps) {
  const url = apiUrl("/mcp")

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg">
        <ModalHeader onClose={() => onOpenChange(false)}>
          Server MCP
        </ModalHeader>
        <CardContent className="flex flex-col gap-4 overflow-y-auto py-4">
          <span className="text-xs text-muted-foreground">
            Agents anywhere can reach your boards through the sync server. The
            first call opens a browser to sign in, and the agent gets the boards
            of whichever account you sign in as.
          </span>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Claude Code</span>
            <CopyField
              label="command"
              value={`claude mcp add --transport http doska ${url}`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Other clients</span>
            <CopyField label="URL" value={url} />
          </div>
          <a
            href="https://doska.sh/docs/mcp"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Tools and limits in the docs
          </a>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
