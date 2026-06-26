import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@doska/ui-kit"
import { cn } from "@doska/ui-kit"
import { fallbackCard } from "@/lib/seed"
import { Draggable } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { CardContextMenu, CardMenu } from "./card-menu"
import { TaskIndicator } from "./task-indicator"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { MarkdownCardPreview, taskProgress } from "@doska/markdown"
import { Card } from "./card"

interface IProps {
  id: string
  index: number
  showBody: boolean
  onDelete: () => void
}

export function DraggableCard({ id, index, showBody, onDelete }: IProps) {
  const [, navigate] = useLocation()
  const { data: card = fallbackCard } = useCard(id)
  const { mutate: updateCard } = useUpdateCard(id)
  const { title, body } = card
  const { done, total } = taskProgress(body)

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDropAnimating && { transitionDuration: "0.15s" }),
          }}
          onClick={(e) => {
            if (snapshot.isDragging) return
            e.currentTarget.blur()
            navigate(routes.card.to(id))
          }}
          index={index}
          isDragging={snapshot.isDragging}
          onDelete={onDelete}
          showBody={showBody}
          id={id}
        />
      )}
    </Draggable>
  )
}
