import { CardId, TaskIndicator, cn } from "@doska/ui-kit"
import { cardDisplayId } from "@doska/contract"
import { taskProgress } from "@doska/markdown"
import { fallbackCard } from "@/lib/seed"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { useDeckPrefix } from "../deck/deck-context"
import { CardDeadline } from "./deadline/card-deadline"

interface IProps {
  cardId: string
  /** The unsaved body, for callers holding a draft — task progress tracks it live. */
  body?: string
  className?: string
}

/** A card's id, task progress and deadline — on the board card and in its panel. */
export function CardMeta({ cardId, body, className }: IProps) {
  const prefix = useDeckPrefix()
  const { data: card = fallbackCard } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  const displayId = cardDisplayId(prefix, card.number)
  const { done, total } = taskProgress(body ?? card.body)

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {displayId && <CardId id={displayId} />}
      {total > 0 && <TaskIndicator done={done} total={total} />}
      <CardDeadline
        value={card.deadline}
        onChange={(deadline) => updateCard({ deadline })}
      />
    </div>
  )
}
