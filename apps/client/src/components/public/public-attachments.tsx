import { useState } from "react"
import { type Attachment, publicAttachmentUrl } from "@doska/core"
import { AttachmentList } from "../card/attachments/attachment-list"
import { AttachmentViewer } from "../card/attachments/attachment-viewer"
import { isRenderableImage } from "../card/attachments/renderable-image"

interface IProps {
  attachments: Attachment[]
  token: string
  className?: string
}

/** A card's attachments on a public board: every URL is the token's to serve. */
export function PublicAttachments({ attachments, token, className }: IProps) {
  const [viewing, setViewing] = useState<Attachment | null>(null)

  const urls = Object.fromEntries(
    attachments.map((a) => [a.key, publicAttachmentUrl(token, a.key)])
  )

  return (
    <>
      <AttachmentList
        attachments={attachments}
        className={className}
        onOpen={(att) => {
          if (isRenderableImage(att.mime)) setViewing(att)
          else window.open(urls[att.key], "_blank")
        }}
      />
      <AttachmentViewer
        attachment={viewing}
        src={viewing ? urls[viewing.key] : null}
        source="token"
        onClose={() => setViewing(null)}
        onDownload={() => {
          if (!viewing) return
          const url = urls[viewing.key]
          if (!url) throw new Error("no url for this attachment")
          window.open(url, "_blank")
        }}
      />
    </>
  )
}
