import { Modal, ModalContent, ModalTitle } from "@doska/ui-kit"
import { Download, X } from "lucide-react"
import type { Attachment } from "@/lib/types"
import { downloadUrl } from "@/lib/api/runtime"
import { useAttachmentUrl } from "@/lib/hooks/use-attachment-url"

interface IProps {
  cardId: string
  attachment: Attachment | null
  onClose: () => void
}

/** Full-screen image preview with an explicit close, so a standalone PWA window never navigates away from the board. */
export function AttachmentViewer({ cardId, attachment, onClose }: IProps) {
  return (
    <Modal open={!!attachment} onOpenChange={(open) => !open && onClose()}>
      {attachment && (
        <ModalContent
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="overflow-hidden"
        >
          <Viewer cardId={cardId} attachment={attachment} onClose={onClose} />
        </ModalContent>
      )}
    </Modal>
  )
}

function Viewer({
  cardId,
  attachment,
  onClose,
}: IProps & { attachment: Attachment }) {
  const url = useAttachmentUrl(cardId, attachment)

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b p-3">
        <ModalTitle className="line-clamp-1 flex-1">
          {attachment.name}
        </ModalTitle>
        <button
          type="button"
          aria-label="Download"
          disabled={!url}
          onClick={() => url && downloadUrl(url, attachment.name)}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Download className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto">
        {url && (
          <img
            src={url}
            alt={attachment.name}
            className="max-h-full overflow-hidden"
          />
        )}
      </div>
    </>
  )
}
