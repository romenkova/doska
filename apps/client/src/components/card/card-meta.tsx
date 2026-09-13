import { TaskIndicator, cn } from "@doska/ui-kit"
import { taskProgress, type TaskProgress } from "@doska/markdown"
import type { ReactNode } from "react"
import type { Card, Column } from "@doska/core/types"
import { ConflictMarker } from "./conflict-marker"
import { CardDeadline } from "./deadline/card-deadline"
import { CardPriority } from "./priority/card-priority"

interface IProps {
  card: Card
  /** The column the card sits in — a card in the done column reads as finished. */
  column?: Column | null
  /** The unsaved body, for callers holding a draft — task progress tracks it live. */
  body?: string
  /** Already-counted progress, for a caller that needed the count itself. */
  tasks?: TaskProgress
  /** Omit to show the deadline without a picker. */
  onChangeDeadline?: (deadline: string | null) => void
  /** Omit to show the priority without a picker. */
  onChangePriority?: (priority: string) => void
  className?: string
  showEmpty?: boolean
  lead?: ReactNode
}

/** A card's task progress, deadline and priority — on the board card and in its panel. */
export function CardMeta({
  card,
  column,
  body,
  tasks,
  onChangeDeadline,
  onChangePriority,
  className,
  showEmpty,
  lead,
}: IProps) {
  const { done, total } = tasks ?? taskProgress(body ?? card.body)

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      {lead}
      {total > 0 && <TaskIndicator done={done} total={total} />}
      {(showEmpty || !!card.deadline) && (
        <CardDeadline
          done={column?.done ?? false}
          value={card.deadline}
          onChange={onChangeDeadline}
        />
      )}
      {(showEmpty || !!card.priority) && (
        <CardPriority value={card.priority} onChange={onChangePriority} />
      )}
      {card.bodyConflict && <ConflictMarker />}
    </div>
  )
}
