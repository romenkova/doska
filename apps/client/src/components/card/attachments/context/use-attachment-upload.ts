import { useCallback, useState } from "react"
import type { Attachment } from "@/lib/types"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { activeStorage } from "@/lib/api/attachments"
import { isSyncConfigured } from "@/lib/api/server"

/**
 * Uploading files to a card: shared by the header's Attach button and the
 * drop zone. Puts each file on the active storage backend and appends it to the
 * card. `enabled` is false when no sync backend is configured (nowhere to store).
 */
/** A file being uploaded, shown as a placeholder tile until it's saved. */
export interface PendingUpload {
  id: string
  name: string
  mime: string
}

export function useAttachmentUpload(cardId: string) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [error, setError] = useState<string | null>(null)

  const enabled = isSyncConfigured()
  const existing = card?.attachments

  const addFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const list = files ? Array.from(files) : []
      if (!list.length) return
      if (!enabled) {
        setError("Connect a sync backend to attach files")
        return
      }
      const queued = list.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        mime: file.type || "application/octet-stream",
      }))
      setPending((prev) => [...prev, ...queued])
      setError(null)
      try {
        const storage = activeStorage()
        const added: Attachment[] = []
        for (let i = 0; i < list.length; i++) {
          const file = list[i]
          const stored = await storage.put(cardId, {
            name: file.name,
            mime: queued[i].mime,
            bytes: file,
          })
          added.push({
            id: queued[i].id,
            name: file.name,
            key: stored.key,
            mime: stored.mime,
            size: stored.size,
          })
        }
        save({ attachments: [...(existing ?? []), ...added] })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setPending((prev) => prev.filter((p) => !queued.some((q) => q.id === p.id)))
      }
    },
    [cardId, enabled, existing, save]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    addFiles,
    clearError,
    pending,
    busy: pending.length > 0,
    error,
    enabled,
  }
}
