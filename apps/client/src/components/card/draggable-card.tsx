import { Draggable } from "@hello-pangea/dnd"
import { memo, useRef } from "react"
import { useLocation } from "wouter"
import type { CardPatch } from "@doska/core/mutations"
import type { Card as CardData, Column } from "@doska/core/types"
import { DROP_ANIMATION_MS } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { Card } from "./card"
import { GhostChip } from "./ghost-chip"
import { OrderAnimator } from "./order-animator"

interface IProps {
  card: CardData
  column: Column
  index: number
  showBody: boolean
  /** Shrinks the dragged card to its title. */
  compact: boolean
  vanishOnDrop: boolean
  onPatch: (id: string, patch: CardPatch) => void
  /** The card has finished its drop animation and is back in the layout. */
  onDropSettled: (id: string) => void
}

export const DraggableCard = memo(function DraggableCard({
  card,
  column,
  index,
  showBody,
  compact,
  vanishOnDrop,
  onPatch,
  onDropSettled,
}: IProps) {
  const [, navigate] = useLocation()
  const id = card.id
  const grab = useRef({ x: 0, y: 0 })

  return (
    <OrderAnimator>
      <Draggable draggableId={id} index={index}>
        {(provided, snapshot) => {
          const box = {
            ...provided.draggableProps.style,
            ...(snapshot.isDropAnimating && {
              transitionDuration: `${DROP_ANIMATION_MS}ms`,
            }),
            ...(vanishOnDrop &&
              snapshot.isDropAnimating && {
                transitionDuration: "0.001s",
                opacity: 0,
              }),
            // The library opens a gap for the card to fly back into
            ...(vanishOnDrop && !snapshot.isDragging && { transform: "none" }),
          }
          return (
            <>
              <Card
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                // The library already transitions opacity, so the card fades out
                // under the chip on its own.
                style={{
                  ...box,
                  ...(compact && snapshot.isDragging && { opacity: 0 }),
                }}
                onPointerDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  grab.current = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  }
                }}
                onTransitionEnd={(event) => {
                  provided.draggableProps.onTransitionEnd?.(event)
                  if (
                    event.target === event.currentTarget &&
                    event.propertyName === "transform"
                  )
                    onDropSettled(id)
                }}
                onClick={(e) => {
                  if (snapshot.isDragging) return
                  e.currentTarget.blur()
                  navigate(routes.card.to(id))
                }}
                isDragging={snapshot.isDragging}
                showBody={showBody}
                card={card}
                column={column}
                onPatch={onPatch}
              />
              {snapshot.isDragging && (
                <GhostChip
                  box={box}
                  compact={compact}
                  grab={grab.current}
                  title={card.title}
                />
              )}
            </>
          )
        }}
      </Draggable>
    </OrderAnimator>
  )
})
