import { Draggable } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { Card } from "./card"

interface IProps {
  id: string
  index: number
  showBody: boolean
}

export function DraggableCard({ id, index, showBody }: IProps) {
  const [, navigate] = useLocation()

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
          showBody={showBody}
          id={id}
        />
      )}
    </Draggable>
  )
}
