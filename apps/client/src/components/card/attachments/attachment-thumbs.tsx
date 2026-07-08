import type { Attachment } from "@/lib/types"
import { AttachmentRow } from "./attachment-row"

/** Read-only strip of attachment squares shown on a board card face. */
export function AttachmentThumbs({
  cardId,
  attachments,
}: {
  cardId: string
  attachments: Attachment[]
}) {
  if (!attachments.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((att) => (
        <AttachmentRow
          key={att.id}
          cardId={cardId}
          attachment={att}
          className="size-10"
        />
      ))}
    </div>
  )
}
