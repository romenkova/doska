import type { Dashboard } from "@doska/core/types"
import { BoardHeader } from "@/components/board/board-header"
import { BoardList } from "@/components/board/board-list"

interface IProps {
  board: Dashboard
}

export function Board({ board }: IProps) {
  return (
    <>
      <BoardHeader board={board} />
      <BoardList key={board.id} board={board} />
    </>
  )
}
