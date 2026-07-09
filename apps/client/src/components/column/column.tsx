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
      className="flex w-[90vw] max-w-96 shrink-0 snap-start flex-col overflow-y-auto overscroll-y-contain pb-6"
    >
      <ColumnHead {...props} />
      <Droppable droppableId={props.id}>
        {(provided, snapshot) => (
          <div
            className={cn(
              "flex min-h-40 w-full shrink-0 flex-col rounded-3xl bg-background p-4 transition-colors",
              "border border-sidebar-primary-foreground",
              "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]",
              snapshot.isDraggingOver && "bg-primary/5 dark:bg-sidebar/50"
            )}
          >
            <Button
              variant="muted"
              onClick={onAddCard}
              aria-label={`Add card to ${props.title}`}
              className="mb-3 w-full"
            >
              <Plus />
            </Button>
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-1 flex-col"
            >
              {children}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  )
}
