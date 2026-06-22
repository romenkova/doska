import { useState } from "react"
import { createPortal } from "react-dom"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableStateSnapshot,
  type DropResult,
} from "@hello-pangea/dnd"
import { generateKeyBetween } from "fractional-indexing"
import { GripVertical } from "lucide-react"
import {
  Button,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  cn,
} from "@doska/ui-kit"
import type { Column } from "@/lib/types"
import { byPosition } from "@/lib/utils"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: Column[]
  onReorder: (changed: Column[]) => void
}

export function ReorderColumnsModal({
  open,
  onOpenChange,
  columns,
  onReorder,
}: IProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:p-6">
        <div className="flex flex-1 flex-col gap-4 p-6 md:flex-none md:p-0">
          <div className="flex flex-col gap-1">
            <ModalTitle>Reorder columns</ModalTitle>
            <ModalDescription>
              Drag a column to change its place on the board.
            </ModalDescription>
          </div>

          {/* Mounted fresh on open so local order seeds from the current board. */}
          {open && <ReorderList columns={columns} onReorder={onReorder} />}

          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

/**
 * Lists the board's columns as vertical blocks that can be dragged to reorder.
 * Local state drives the rendered order so @hello-pangea/dnd sees the move
 * committed within the drop event; each drop persists the single moved column
 * with a freshly minted fractional position.
 */
function ReorderList({
  columns,
  onReorder,
}: {
  columns: Column[]
  onReorder: (changed: Column[]) => void
}) {
  const [order, setOrder] = useState<Column[]>(() =>
    [...columns].sort(byPosition)
  )

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination || destination.index === source.index) return

    const next = [...order]
    const [moved] = next.splice(source.index, 1)

    // Neighbors at the drop site, with the moved column already removed.
    const before = next[destination.index - 1]
    const after = next[destination.index]
    const position = generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    )

    const updated = { ...moved, position }
    next.splice(destination.index, 0, updated)
    setOrder(next)
    onReorder([updated])
  }

  const blockClassName = (snapshot: DraggableStateSnapshot) =>
    cn(
      "mb-2 flex items-center gap-3 rounded-xl border bg-background px-3 py-3",
      "text-sm font-medium select-none",
      snapshot.isDragging && "shadow-lg"
    )

  const blockBody = (column: Column) => (
    <>
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{column.title || "Untitled column"}</span>
    </>
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="reorder-columns"
        // The modal is centered with a CSS transform, which would make the
        // dragged item (positioned `fixed`) anchor to the modal instead of the
        // viewport. Portal the drag clone to the body so it escapes that
        // transform and tracks the cursor.
        renderClone={(provided, snapshot, rubric) =>
          createPortal(
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                ...(snapshot.isDropAnimating && { transitionDuration: "0.15s" }),
              }}
              className={blockClassName(snapshot)}
            >
              {blockBody(order[rubric.source.index])}
            </div>,
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
            {order.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      ...(snapshot.isDropAnimating && {
                        transitionDuration: "0.15s",
                      }),
                    }}
                    className={blockClassName(snapshot)}
                  >
                    {blockBody(column)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
