import { useDeleteColumn, useBoard } from "@doska/core"
import { ConfirmBody, SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { useActiveBoard } from "@/lib/use-active-board"

export default function ColumnDeleteSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deckId } = useActiveBoard()

  return deckId && id ? <Body deckId={deckId} columnId={id} /> : null
}

function Body({ deckId, columnId }: { deckId: string; columnId: string }) {
  const { data: board } = useBoard(deckId)
  const { mutate: deleteColumn } = useDeleteColumn(deckId)

  const column = board?.columns.find((one) => one.id === columnId)
  if (!column) return null

  const title = column.title || "Untitled column"
  const description =
    `"${title}" and all of its cards move to the trash, where they stay ` +
    "restorable for 14 days."

  return (
    <SheetScreen>
      <ConfirmBody
        title="Delete column?"
        description={description}
        confirmLabel="Delete column"
        onConfirm={() => deleteColumn(column.id)}
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}
