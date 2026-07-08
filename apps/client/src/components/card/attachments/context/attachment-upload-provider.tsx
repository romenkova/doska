import type { ReactNode } from "react"
import { useAttachmentUpload } from "./use-attachment-upload"
import { UploadCtx } from "./attachment-upload-context"

/**
 * Holds one upload instance so the Attach button, drop zone, and attachment
 * list share the same busy/pending state. Wrap the card editor with it.
 */
export function AttachmentUploadProvider({
  cardId,
  children,
}: {
  cardId: string
  children: ReactNode
}) {
  const api = useAttachmentUpload(cardId)
  return <UploadCtx.Provider value={api}>{children}</UploadCtx.Provider>
}
