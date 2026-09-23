import { useAccount } from "@doska/core/account"
import { keys } from "@doska/core/keys"
import { setLastBoard } from "@doska/core/last-board"
import { useSaveCard } from "@doska/core/mutations"
import { createCard, getBoard } from "@doska/core/operations"
import { useDashboards } from "@doska/core/queries"
import { isSyncConfigured } from "@doska/core/server"
import type { Attachment } from "@doska/core/types"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native"
import { imageMarkdown, isImage, uploadFiles } from "@/lib/upload-files"
import type { ShareDraft } from "./share-draft"

interface IProps {
  draft: ShareDraft
  onDone: () => void
}

/** Files a share as a new card at the top of the picked board's first column. */
export function ShareToBoard({ draft, onDone }: IProps) {
  const qc = useQueryClient()
  const { data: boards = [] } = useDashboards()
  const { mutateAsync: saveCard } = useSaveCard()
  const { authed } = useAccount()
  const [savingTo, setSavingTo] = useState<string | null>(null)

  async function save(boardId: string) {
    const [column] = (await getBoard(boardId)).columns
    if (!column) {
      Alert.alert("This board has no columns")
      return
    }
    setSavingTo(boardId)
    const id = await createCard(column.id)

    let attachments: Attachment[] = []
    if (draft.files.length && !(isSyncConfigured() && authed)) {
      Alert.alert("Files skipped", "Files live on the server. Sign in first.")
    } else {
      try {
        attachments = await uploadFiles(draft.files)
      } catch (err) {
        Alert.alert(
          "Upload failed",
          err instanceof Error ? err.message : undefined
        )
      }
    }
    const images = attachments.filter(isImage).map(imageMarkdown)
    const body = [draft.body, ...images].filter(Boolean).join("\n\n")

    await saveCard({ id, patch: { title: draft.title, body, attachments } })
    qc.invalidateQueries({ queryKey: keys.board(boardId) })
    setLastBoard(boardId)
    onDone()
  }

  if (!boards.length) {
    return (
      <Text className="py-6 text-center text-muted-foreground">
        Make a board first, then share to it.
      </Text>
    )
  }

  return (
    <View>
      {boards.map((board) => (
        <Pressable
          key={board.id}
          disabled={savingTo !== null}
          onPress={() => void save(board.id)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
        >
          <Text className="flex-1 text-[17px] font-sans text-card-foreground">
            {board.title || "Untitled board"}
          </Text>
          {savingTo === board.id ? <ActivityIndicator size="small" /> : null}
        </Pressable>
      ))}
    </View>
  )
}
