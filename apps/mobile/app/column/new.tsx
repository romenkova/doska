import { useCreateColumn } from "@doska/core/mutations"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { NameForm } from "@/components/shell/name-form"
import { useActiveBoard } from "@/lib/use-active-board"

export default function NewColumnSheet() {
  const { deckId } = useActiveBoard()
  return deckId ? <Body deckId={deckId} /> : null
}

function Body({ deckId }: { deckId: string }) {
  const { mutate: createColumn } = useCreateColumn(deckId)

  return (
    <SheetScreen>
      <NameForm
        title="New column"
        placeholder="Column name"
        confirmLabel="Add"
        onCommit={(title) => createColumn(title)}
        // Past the actions sheet underneath, back to the board.
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}
