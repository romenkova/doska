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

/**
 * Lists the board's columns as vertical blocks that can be dragged to reorder.
 */
export function ReorderColumnsModal({
  open,
  onOpenChange,
  columns,
  onReorder,
}: IProps) {
  const ordered = [...columns].sort(byPosition)

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination || destination.index === source.index) return

    const moved = ordered[source.index]
    if (!moved) return

    // The list as rendered, minus the column being dropped, so the insertion
    // index lines up with the neighbors at the drop site.
    const rest = ordered.filter((c) => c.id !== moved.id)
    const before = rest[destination.index - 1]
    const after = rest[destination.index]
    const position = generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    )

    onReorder([{ ...moved, position }])
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
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:p-6">
        <div className="flex flex-1 flex-col gap-4 p-6 md:flex-none md:p-0">
          <div className="flex flex-col gap-1">
            <ModalTitle>Reorder columns</ModalTitle>
            <ModalDescription>
              Drag a column to change its place on the board.
            </ModalDescription>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="reorder-columns"
              // The modal is centered with a CSS transform, which would make the
              // dragged item (positioned `fixed`) anchor to the modal instead of
              // the viewport. Portal the drag clone to the body so it escapes
              // that transform and tracks the cursor.
              renderClone={(provided, snapshot, rubric) =>
                createPortal(
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      ...(snapshot.isDropAnimating && {
                        transitionDuration: "0.15s",
                      }),
                    }}
                    className={blockClassName(snapshot)}
                  >
                    {blockBody(ordered[rubric.source.index])}
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
                  {ordered.map((column, index) => (
                    <Draggable
                      key={column.id}
                      draggableId={column.id}
                      index={index}
                    >
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
