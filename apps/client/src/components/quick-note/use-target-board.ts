import { useState } from "react"
import { useLastBoard } from "@doska/core/last-board"
import { useBoard, useDashboards } from "@doska/core/queries"

const BOARD_KEY = "doska:quick-note-board"
const COLUMN_KEY = "doska:quick-note-column"

export function useTargetBoard() {
  const dashboards = useDashboards().data ?? []
  const lastBoard = useLastBoard()
  const [picked, setPicked] = useState(() => localStorage.getItem(BOARD_KEY))
  const [pickedColumn, setPickedColumn] = useState(() =>
    localStorage.getItem(COLUMN_KEY)
  )
  const boardId =
    [picked, lastBoard].find((id) => dashboards.some((d) => d.id === id)) ??
    dashboards[0]?.id ??
    null
  const columns = useBoard(boardId ?? "").data?.columns ?? []
  const column = columns.find((c) => c.id === pickedColumn) ?? columns[0]

  function pick(id: string) {
    localStorage.setItem(BOARD_KEY, id)
    localStorage.removeItem(COLUMN_KEY)
    setPicked(id)
    setPickedColumn(null)
  }

  function pickColumn(id: string) {
    localStorage.setItem(COLUMN_KEY, id)
    setPickedColumn(id)
  }

  return { dashboards, boardId, columns, column, pick, pickColumn }
}
