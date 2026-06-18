import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui"
import { Markdown } from "@/components/domain/markdown/markdown"
import { fallbackCard, taskProgress } from "@/lib/card-data"
import { cn } from "@/lib/utils"
import { Draggable } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { CardMenu } from "./card-menu"
import { TaskIndicator } from "./task-indicator"
import { useCard } from "@/lib/data/queries"

interface IProps {
  id: string
  index: number
  showBody: boolean
  onDelete: () => void
}

export function DraggableCard({ id, index, showBody, onDelete }: IProps) {
  const [, navigate] = useLocation()
  const { data: card = fallbackCard } = useCard(id)
  const { title, body } = card
  const { done, total } = taskProgress(body)

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDropAnimating && { transitionDuration: "0.12s" }),
          }}
          onClick={(e) => {
            if (snapshot.isDragging) return
            e.currentTarget.blur()
            navigate(routes.card.to(id))
          }}
          className={cn(
            "group relative mb-3 w-full max-w-sm cursor-pointer rounded-lg",
            "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
          )}
        >
          <CardBase
            className={cn(
              "gap-0",
              snapshot.isDragging && "shadow-shade/5 shadow-xl"
            )}
          >
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              <CardAction className="flex items-center gap-1">
                {total > 0 && <TaskIndicator done={done} total={total} />}
                <CardMenu
                  onEdit={() => navigate(routes.card.to(id))}
                  onDelete={onDelete}
                />
              </CardAction>
            </CardHeader>
            {body && (
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  showBody ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <CardContent className="space-y-3 pt-4">
                    <Markdown>{body}</Markdown>
                  </CardContent>
                </div>
              </div>
            )}
          </CardBase>
        </div>
      )}
    </Draggable>
  )
}
