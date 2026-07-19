import { useAttachmentUrlByKey } from "@/lib/hooks/use-attachment-url"

interface IProps {
  cardId: string
  attachmentKey: string
  alt: string
}

/** Renders a body image ref by resolving its storage URL; nothing until resolved. */
export function AttachmentImage({ cardId, attachmentKey, alt }: IProps) {
  const url = useAttachmentUrlByKey(cardId, attachmentKey)
  if (!url) return null
  return <img src={url} alt={alt} loading="lazy" />
}
