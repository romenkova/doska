import { cn } from "@doska/ui-kit"
import { FileText } from "lucide-react"
import type { Attachment } from "@/lib/types"
import { useAttachmentUrl } from "@/lib/hooks/use-attachment-url"

function isImage(mime: string): boolean {
  return mime.startsWith("image/")
}

/** Lowercase extension label from a name/key, e.g. `PDF`; empty when unknown. */
function extLabel(att: Attachment): string {
  const dot = att.name.lastIndexOf(".")
  return dot > 0
    ? att.name
        .slice(dot + 1)
        .toUpperCase()
        .slice(0, 4)
    : ""
}

interface IProps {
  cardId: string
  attachment: Attachment
  className?: string
  onOpen?: () => void
}

/** A small square preview: image thumbnail, or a file icon with its extension. */
export function AttachmentRow({
  cardId,
  attachment,
  className,
  onOpen,
}: IProps) {
  const url = useAttachmentUrl(cardId, attachment)
  const image = isImage(attachment.mime)

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => e.key === "Enter" && onOpen() : undefined}
      title={attachment.name}
      className={cn(
        "relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
        "flex items-center justify-center",
        onOpen && "cursor-pointer",
        className
      )}
    >
      {image && url ? (
        <img
          src={url}
          alt={attachment.name}
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <FileText className="size-5" />
        </div>
      )}
    </div>
  )
}
