import { useState } from "react"
import { useLastBoard } from "@doska/core/last-board"
import { useBoard, useDashboards } from "@doska/core/queries"

const BOARD_KEY = "doska:quick-note-board"

export function useTargetBoard() {
  const dashboards = useDashboards().data ?? []
  const lastBoard = useLastBoard()
  const [picked, setPicked] = useState(() => localStorage.getItem(BOARD_KEY))
  const boardId =
    [picked, lastBoard].find((id) => dashboards.some((d) => d.id === id)) ??
    dashboards[0]?.id ??
    null
  const column = useBoard(boardId ?? "").data?.columns[0]

  function pick(id: string) {
    localStorage.setItem(BOARD_KEY, id)
    setPicked(id)
  }

  return { dashboards, boardId, column, pick }
}
