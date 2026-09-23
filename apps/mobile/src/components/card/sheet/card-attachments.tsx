import { activeStorage } from "@doska/core/attachments"
import { useUpdateCard } from "@doska/core/mutations"
import type { Attachment } from "@doska/core/types"
import { useState } from "react"
import { Alert, View } from "react-native"
import { openAttachment } from "@/lib/open-attachment"
import type { LocalFile } from "@/lib/upload-files"
import { AttachmentRow } from "./attachment-row"

interface IProps {
  cardId: string
  attachments: Attachment[]
  pending: LocalFile[]
}

export function CardAttachments({ cardId, attachments, pending }: IProps) {
  const { mutate: save } = useUpdateCard(cardId)
  const [openingId, setOpeningId] = useState<string | null>(null)

  if (!attachments.length && !pending.length) return null

  function confirmRemove(attachment: Attachment) {
    Alert.alert(`Delete ${attachment.name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          save({
            attachments: attachments.filter((a) => a.id !== attachment.id),
          })

          activeStorage()
            .remove(cardId, attachment.key)
            .catch(() => undefined)
        },
      },
    ])
  }

  function open(attachment: Attachment) {
    setOpeningId(attachment.id)
    openAttachment(attachment)
      .catch(() => Alert.alert(`Could not open ${attachment.name}`))
      .finally(() => setOpeningId(null))
  }

  return (
    <View className="px-4 py-2">
      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.id}
          name={attachment.name}
          isPending={openingId === attachment.id}
          onPress={() => open(attachment)}
          onLongPress={() => confirmRemove(attachment)}
        />
      ))}
      {pending.map((file) => (
        <AttachmentRow key={file.uri} name={file.name} isPending />
      ))}
    </View>
  )
}
