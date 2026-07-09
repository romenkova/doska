import { cn } from "@doska/ui-kit"
import { FileText } from "lucide-react"
import { useState } from "react"
import type { Attachment } from "@/lib/types"
import { useAttachmentUrl } from "@/lib/hooks/use-attachment-url"
import { isRenderableImage } from "./renderable-image"

interface IProps {
  cardId: string
  attachment: Attachment
  className?: string
  onOpen?: () => void
}

/** A small square preview: image thumbnail, or a file icon with its extension. */
export function AttachmentTile({
  cardId,
  attachment,
  className,
  onOpen,
}: IProps) {
  const url = useAttachmentUrl(cardId, attachment)
  const [failed, setFailed] = useState(false)
  const image = isRenderableImage(attachment.mime) && !failed

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => e.key === "Enter" && onOpen() : undefined}
      title={attachment.name}
      className={cn(
        "relative aspect-square overflow-hidden rounded-sm",
        "flex items-center justify-center",
        onOpen && "cursor-pointer",
        className
      )}
    >
      {image && url ? (
        <img
          src={url}
          alt={attachment.name}
          className="size-full border object-cover"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <FileText className="rounded-sm border p-1 text-muted-foreground group-hover/item:text-foreground" />
      )}
    </div>
  )
}
