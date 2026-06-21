import { Droppable } from "@hello-pangea/dnd"
import type { ReactNode } from "react"
import { Button, cn } from "@doska/ui-kit"
import { Plus } from "lucide-react"
import { ColumnHead } from "./column-head"

interface IProps {
  children: ReactNode
  id: string
  title: string
  showBody: boolean
  onToggleBody: () => void
  onAddCard: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function Column({ children, onAddCard, ...props }: IProps) {
  return (
    <div
      role="group"
      aria-label={props.title}
      className="flex w-[90vw] max-w-96 shrink-0 flex-col"
    >
      <ColumnHead {...props} />
      <Droppable droppableId={props.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-40 w-full flex-col rounded-3xl bg-background p-4",
              "border border-sidebar-primary-foreground transition-all",
              "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]",
              snapshot.isDraggingOver && "bg-primary/5 dark:bg-sidebar"
            )}
          >
            <Button
              variant="dashed"
              onClick={onAddCard}
              aria-label={`Add card to ${props.title}`}
              className="mb-3 w-full"
            >
              <Plus />
            </Button>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
