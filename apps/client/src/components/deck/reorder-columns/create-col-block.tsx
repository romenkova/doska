import type { Column } from "@doska/contract"
import { cn } from "@doska/ui-kit"
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd"
import { GripVertical } from "lucide-react"

export function createColumnBlock(column: Column) {
  return (
    dragProvided: DraggableProvided,
    snapshot: DraggableStateSnapshot
  ) => (
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
      className={cn(
        "mb-2 flex items-center gap-3 rounded-xl border bg-background px-3 py-3",
        "text-sm font-medium select-none",
        snapshot.isDragging && "shadow-lg"
      )}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate uppercase">
        {column.title || "Untitled column"}
      </span>
    </div>
  )
}
