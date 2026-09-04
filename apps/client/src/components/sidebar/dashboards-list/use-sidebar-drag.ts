import type {
  BeforeCapture,
  DragStart,
  DragUpdate,
  DropResult,
} from "@hello-pangea/dnd"
import { useMoveSidebarItem } from "@doska/core/mutations"
import type { PointerEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { SidebarRow } from "./sidebar-drop"
import { sidebarDropTarget } from "./sidebar-drop"

// ml-4
const INDENT_PX = 16

export function useSidebarDrag(rows: SidebarRow[]) {
  const { mutate: moveSidebarItem } = useMoveSidebarItem()
  const [drag, setDrag] = useState<DragUpdate | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const pull = usePullRight(drag !== null)

  const findRow = (id: string) => rows.find((row) => row.id === id)

  const landingFolderId = useMemo(() => {
    if (!drag) return null
    const move = sidebarDropTarget(rows, drag, pull.nested)
    if (move) return move.target.kind === "folder" ? move.target.folderId : null
    // No move means it lands back where it started.
    const dragged = rows.find((row) => row.id === drag.draggableId)
    return dragged?.type === "board" ? dragged.folderId : null
  }, [drag, rows, pull.nested])

  const responders = {
    // Runs before dimensions are captured, so the boards are 0px by then.
    onBeforeCapture: ({ draggableId }: BeforeCapture) => {
      if (findRow(draggableId)?.type === "folder") {
        setDraggingFolderId(draggableId)
      }
    },
    onDragStart: (start: DragStart) => {
      const row = findRow(start.draggableId)
      pull.start(row?.type === "board" && row.folderId !== null)
      setDrag({ ...start, destination: start.source, combine: null })
    },
    onDragUpdate: setDrag,
    onDragEnd: (result: DropResult) => {
      setDrag(null)
      setDraggingFolderId(null)
      const move = sidebarDropTarget(rows, result, pull.nested)
      if (move) moveSidebarItem(move)
    },
  }

  return {
    dragging: drag !== null,
    draggingFolderId,
    landingFolderId,
    responders,
    onPointerDown: pull.onPointerDown,
  }
}

// Pulling the pointer right of where the drag started nests the board.
// A board that starts nested is already one indent in.
function usePullRight(active: boolean) {
  const [nested, setNested] = useState(false)
  const origin = useRef({ x: 0, indent: 0 })

  useEffect(() => {
    if (!active) return
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const { x, indent } = origin.current
      setNested(event.clientX - x + indent > INDENT_PX / 2)
    }
    window.addEventListener("pointermove", onPointerMove)
    return () => window.removeEventListener("pointermove", onPointerMove)
  }, [active])

  return {
    nested,
    onPointerDown: (event: PointerEvent) => {
      origin.current.x = event.clientX
    },
    start: (nested: boolean) => {
      origin.current.indent = nested ? INDENT_PX : 0
      setNested(nested)
    },
  }
}
