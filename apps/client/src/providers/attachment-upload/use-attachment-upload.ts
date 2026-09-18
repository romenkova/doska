import { createElement, useCallback, useState } from "react"
import { toast } from "react-hot-toast"
import type { Attachment } from "@doska/core/types"
import { useCard } from "@doska/core/queries"
import { useUpdateCard } from "@doska/core/mutations"
import { activeStorage } from "@doska/core/attachments"
import { isSyncConfigured } from "@doska/core/server"
import { useAuth } from "@/lib/hooks"
import { ErrorToast } from "@/components/toasts/error/error-toast"

/**
 * Uploading files to a card: shared by the header's Attach button and the
 * drop zone. Puts each file on the active storage backend and appends it to the
 * card. Uploads hit an authed-only server route, so `enabled` requires both a
 * configured backend and a signed-in session.
 */
/** A file being uploaded, shown as a placeholder tile until it's saved. */
export interface PendingUpload {
  id: string
  name: string
  mime: string
}

const TOAST_ID = "attachment-error"

function showError(message: string) {
  toast.custom(
    (toastInstance) =>
      createElement(ErrorToast, {
        visible: toastInstance.visible,
        message,
      }),
    { id: TOAST_ID }
  )
}

export function useAttachmentUpload(cardId: string) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const [pending, setPending] = useState<PendingUpload[]>([])

  const { authed } = useAuth()
  const enabled = isSyncConfigured() && authed === true
  const existing = card?.attachments

  let disabledReason: string | null = null
  if (!enabled) {
    disabledReason = isSyncConfigured()
      ? "Sign in to attach files"
      : "Connect a sync backend to attach files"
  }

  const addFiles = useCallback(
    async (files: FileList | File[] | null): Promise<Attachment[]> => {
      const list = files ? Array.from(files) : []
      if (!list.length) return []
      if (!enabled) {
        if (disabledReason) showError(disabledReason)
        return []
      }
      const queued = list.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        mime: file.type || "application/octet-stream",
      }))
      setPending((prev) => [...prev, ...queued])
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
        return added
      } catch (err) {
        showError(err instanceof Error ? err.message : "Upload failed")
        return []
      } finally {
        setPending((prev) =>
          prev.filter((p) => !queued.some((q) => q.id === p.id))
        )
      }
    },
    [cardId, enabled, disabledReason, existing, save]
  )

  return {
    addFiles,
    pending,
    busy: pending.length > 0,
    enabled,
    disabledReason,
  }
}
