import { useAccount } from "@doska/core/account"
import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { isSyncConfigured } from "@doska/core/server"
import type { Attachment } from "@doska/core/types"
import { useState } from "react"
import { Alert } from "react-native"
import { uploadFiles, type LocalFile } from "./upload-files"

/** Uploads files onto a card, holding the in-flight ones for the list's placeholders. */
export function useAttachmentUpload(cardId: string) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const { authed } = useAccount()
  const [pending, setPending] = useState<LocalFile[]>([])

  async function add(files: LocalFile[]): Promise<Attachment[]> {
    if (!files.length) return []
    if (!isSyncConfigured() || !authed) {
      Alert.alert(
        "Can't attach files",
        "Files live on the server. Sign in first."
      )
      return []
    }
    setPending((prev) => [...prev, ...files])
    try {
      const added = await uploadFiles(files)
      save({ attachments: [...(card?.attachments ?? []), ...added] })
      return added
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : undefined
      )
      return []
    } finally {
      setPending((prev) => prev.filter((file) => !files.includes(file)))
    }
  }

  return { add, pending, busy: pending.length > 0 }
}
