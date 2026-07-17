import { Draggable } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { useFlip } from "@/lib/hooks"
import { Card } from "./card"

interface IProps {
  id: string
  index: number
  showBody: boolean
  animate: boolean
}

export function DraggableCard({ id, index, showBody, animate }: IProps) {
  const [, navigate] = useLocation()
  const { setOuter, setInner } = useFlip(animate)

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={(el) => {
            provided.innerRef(el)
            setOuter(el)
          }}
          innerRef={setInner}
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
