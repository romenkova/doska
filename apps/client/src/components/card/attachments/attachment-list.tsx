import { CardContent, cn } from "@doska/ui-kit"
import { Loader2, Paperclip, X } from "lucide-react"
import type { Attachment } from "@doska/core"

interface IProps {
  attachments: Attachment[]
  onOpen: (attachment: Attachment) => void
  /** Omit to drop the remove button. */
  onRemove?: (attachment: Attachment) => void
  /** Uploads still in flight, shown greyed at the end. */
  pending?: { id: string; name: string }[]
  error?: string
  className?: string
}

const NO_PENDING: { id: string; name: string }[] = []

/** A card's attachments, one clipped name per row. */
export function AttachmentList({
  attachments,
  onOpen,
  onRemove,
  pending = NO_PENDING,
  error,
  className,
}: IProps) {
  if (!attachments.length && !pending.length) return null

  return (
    <CardContent className={cn("border-t-0", className)}>
      <div className="flex flex-col items-start">
        {attachments.map((att) => (
          <div
            key={att.id}
            data-slot="attachment"
            className="group/item flex items-center rounded-md py-0.5"
          >
            <div
              className="flex flex-1 cursor-pointer items-center text-muted-foreground"
              onClick={(e) => {
                onOpen(att)
                e.stopPropagation()
              }}
            >
              <Paperclip className="size-3.5 shrink-0" />
              <span className="line-clamp-1 px-1 text-sm group-hover/item:text-foreground">
                {att.name}
              </span>
            </div>
            {onRemove && (
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => onRemove(att)}
                className={cn(
                  "mt-0.5 ml-2 shrink-0 rounded p-1 text-muted-foreground",
                  "hover:text-destructive"
                )}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1 rounded-md py-0.5 opacity-60"
          >
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            <span className="truncate px-2 text-sm text-muted-foreground">
              {p.name}
            </span>
          </div>
        ))}
      </div>
      {error && <div className="mt-1 text-sm text-destructive">{error}</div>}
    </CardContent>
  )
}
