import { useState } from "react"
import { cn, MdImage } from "@doska/ui-kit"
import type { Attachment, AttachmentSource } from "@doska/core"
import { AttachmentViewer } from "./attachment-viewer"
import { AttachmentUnavailable } from "./attachment-unavailable"
import { useImageFailure } from "./use-image-failure"

interface IProps {
  /** Resolved by the caller; nothing renders until it is. */
  src: string | null
  alt: string
  className?: string
  /** The attachment behind `src`, when known — it is what opens the lightbox. */
  attachment?: Attachment
  source?: AttachmentSource
  onDownload?: () => void | Promise<void>
}

/** A body image ref, rendered from an already-resolved URL. */
export function AttachmentImage({
  src,
  alt,
  className,
  attachment,
  source,
  onDownload,
}: IProps) {
  const [viewing, setViewing] = useState(false)
  const { failed, onError } = useImageFailure(src, source)

  if (failed) {
    return (
      <AttachmentUnavailable
        source={source}
        className={cn("my-4 aspect-video", className)}
      />
    )
  }

  if (!src) return null

  return (
    <>
      <MdImage
        src={src}
        alt={alt}
        onError={onError}
        className={cn(attachment && "cursor-zoom-in", className)}
        onClick={(e) => {
          if (!attachment) return
          e.stopPropagation()
          setViewing(true)
        }}
      />
      {attachment && (
        <AttachmentViewer
          attachment={viewing ? attachment : null}
          src={src}
          source={source}
          onClose={() => setViewing(false)}
          onDownload={() => onDownload?.()}
        />
      )}
    </>
  )
}
