import { useCard, activeStorage } from "@doska/core"
import { downloadBlob } from "@/lib/download"
import { useAttachmentUrlByKey } from "@/lib/hooks/use-attachment-url"
import { AttachmentImage } from "./attachment-image"

interface IProps {
  cardId: string
  attachmentKey: string
  alt: string
  className?: string
}

/** An attachment image on a board the viewer owns: URL and download go through storage. */
export function CardAttachmentImage({
  cardId,
  attachmentKey,
  alt,
  className,
}: IProps) {
  const src = useAttachmentUrlByKey(cardId, attachmentKey)
  const { data: card } = useCard(cardId)
  const attachment = card?.attachments?.find((a) => a.key === attachmentKey)

  return (
    <AttachmentImage
      src={src}
      alt={alt}
      className={className}
      attachment={attachment}
      onDownload={() =>
        attachment &&
        activeStorage()
          .get(cardId, attachmentKey)
          .then((blob) => downloadBlob(blob, attachment.name))
      }
    />
  )
}
