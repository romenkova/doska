import { activeStorage } from "@doska/core/attachments"
import { useUpdateCard } from "@doska/core/mutations"
import type { Attachment } from "@doska/core/types"
import { router } from "expo-router"
import { Alert, View } from "react-native"
import type { LocalFile } from "@/lib/upload-files"
import { ROUTES } from "@/lib/routes"
import { AttachmentRow } from "./attachment-row"

interface IProps {
  cardId: string
  attachments: Attachment[]
  pending: LocalFile[]
}

export function CardAttachments({ cardId, attachments, pending }: IProps) {
  const { mutate: save } = useUpdateCard(cardId)

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

  return (
    <View className="px-4 py-2">
      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.id}
          name={attachment.name}
          onPress={() =>
            router.push(
              ROUTES.cardFile(cardId, attachment.key, attachment.name)
            )
          }
          onLongPress={() => confirmRemove(attachment)}
        />
      ))}
      {pending.map((file) => (
        <AttachmentRow key={file.uri} name={file.name} isPending />
      ))}
    </View>
  )
}
