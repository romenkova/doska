import { cn } from "@doska/ui-kit"
import {
  attachmentUnavailable,
  type AttachmentSource,
  useConnection,
} from "@doska/core"

interface IProps {
  className?: string
  /** Drops the text, for thumbnails too small to read it. */
  compact?: boolean
  source?: AttachmentSource
}

/** Stands in for an image that didn't load, and says why. */
export function AttachmentUnavailable({ className, compact, source }: IProps) {
  const connection = useConnection()
  const message = attachmentUnavailable(connection, source)

  return (
    <span
      role="img"
      aria-label={message}
      title={compact ? message : undefined}
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-center text-muted-foreground",
        className
      )}
    >
      {!compact && <span className="text-xs">{message}</span>}
    </span>
  )
}
