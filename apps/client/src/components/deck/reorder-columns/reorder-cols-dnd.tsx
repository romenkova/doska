import { createPortal } from "react-dom"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import { generateKeyBetween } from "fractional-indexing"
import type { Column } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { createColumnBlock } from "./create-col-block"

interface IProps {
  columns: Column[]
  onReorder: (changed: Column[]) => void
}

export function ReorderColumnsDNDContainer({ columns, onReorder }: IProps) {
  const ordered = [...columns].sort(byPosition)

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination || destination.index === source.index) return

    const moved = ordered[source.index]
    if (!moved) return

    const rest = ordered.filter((c) => c.id !== moved.id)
    const before = rest[destination.index - 1]
    const after = rest[destination.index]
    const position = generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    )

    onReorder([{ ...moved, position }])
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="reorder-columns"
        // The modal is centered with a CSS transform, which would make the
        // dragged item (positioned `fixed`) anchor to the modal instead of
        // the viewport. Portal the drag clone to the body so it escapes
        // that transform and tracks the cursor.
        renderClone={(provided, snapshot, rubric) =>
          createPortal(
            createColumnBlock(ordered[rubric.source.index])(provided, snapshot),
            document.body
          )
        }
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col"
          >
            {ordered.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {createColumnBlock(column)}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
