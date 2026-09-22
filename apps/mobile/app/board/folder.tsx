import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { BoardFolder } from "@/components/board/board-folder"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardFolderSheet() {
  const { deckId } = useActiveBoard()
  if (!deckId) return null

  return (
    <SheetScreen>
      <BoardFolder boardId={deckId} onDone={() => router.dismissAll()} />
    </SheetScreen>
  )
}
