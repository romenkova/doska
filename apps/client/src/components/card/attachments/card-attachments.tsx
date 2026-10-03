import { useState } from "react"
import {
  type Attachment,
  useCard,
  useUpdateCard,
  activeStorage,
  attachmentUnavailable,
  useConnection,
} from "@doska/core"
import { downloadBlob, revealInDownloads } from "@/lib/download"
import { isDesktop } from "@/lib/platform"
import { useAttachmentUrls } from "@/lib/hooks/use-attachment-url"
import { AttachmentList } from "./attachment-list"
import { AttachmentViewer } from "./attachment-viewer"
import { isRenderableImage } from "./renderable-image"
import { usePendingUploads } from "@/providers/attachment-upload/attachment-upload-context"

interface IProps {
  cardId: string
  isReadonly: boolean
  className: string
}

const NO_ATTACHMENTS: Attachment[] = []

/** A card's attachments, backed by the storage adapter. */
export function CardAttachments({ cardId, isReadonly, className }: IProps) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)

  const connection = useConnection()
  const [error, setError] = useState("")
  const [viewing, setViewing] = useState<Attachment | null>(null)
  const pending = usePendingUploads()

  const attachments = card?.attachments ?? NO_ATTACHMENTS
  const urls = useAttachmentUrls(cardId, attachments)

  const persist = (next: Attachment[]) => save({ attachments: next })

  async function remove(att: Attachment) {
    persist(attachments.filter((a) => a.id !== att.id))
    try {
      await activeStorage().remove(cardId, att.key)
    } catch {
      // Orphaned blob is harmless; the record is what the UI reads.
    }
  }

  async function open(att: Attachment) {
    setError("")
    try {
      const storage = activeStorage()
      if (isDesktop()) {
        const blob = await storage.get(cardId, att.key)
        await revealInDownloads(
          att.name,
          new Uint8Array(await blob.arrayBuffer())
        )
        return
      }
      if (isRenderableImage(att.mime)) {
        setViewing(att)
        return
      }
      await downloadBlob(await storage.get(cardId, att.key), att.name)
    } catch {
      setError(attachmentUnavailable(connection))
    }
  }

  return (
    <>
      <AttachmentList
        attachments={attachments}
        pending={pending}
        error={error}
        className={className}
        onOpen={(att) => void open(att)}
        onRemove={isReadonly ? undefined : (att) => void remove(att)}
      />
      <AttachmentViewer
        attachment={viewing}
        src={viewing ? (urls[viewing.key] ?? null) : null}
        onClose={() => setViewing(null)}
        onDownload={async () => {
          if (!viewing) return
          const blob = await activeStorage().get(cardId, viewing.key)
          await downloadBlob(blob, viewing.name)
        }}
      />
    </>
  )
}
