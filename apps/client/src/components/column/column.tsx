import { Droppable } from "@hello-pangea/dnd"
import type { ReactNode } from "react"
import { ColumnHead } from "./column-head"
import { cn } from "@deck/ui-kit"

interface IProps {
  children: ReactNode
  id: string
  title: string
  showBody: boolean
  onToggleBody: () => void
  onAddCard: () => void
}

export function Column({ children, ...props }: IProps) {
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
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
