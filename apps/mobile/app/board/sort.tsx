import { SheetScreen } from "@doska/ui-kit-mobile"
import { BoardSort } from "@/components/board/board-sort"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardSortSheet() {
  const { board } = useActiveBoard()
  if (!board) return null

  return (
    <SheetScreen>
      <BoardSort board={board} />
    </SheetScreen>
  )
}
