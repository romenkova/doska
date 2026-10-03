import {
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  PRIORITIES,
  PriorityChip,
} from "@doska/ui-kit"
import { Check, Flag } from "lucide-react"
import { useUpdateCard, useCard } from "@doska/core"

/** The priority picker, for a card whose chip the board hides when unset. */
export function PrioritySub({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  const value = card?.priority ?? ""
  const isSet = PRIORITIES.some((p) => p.id === value)

  return (
    <MenuSub>
      <MenuSubTrigger>
        <Flag />
        Priority
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        <MenuItem onClick={() => updateCard({ priority: "" })}>
          <Flag className="text-muted-foreground" />
          No priority
          {!isSet && <Check className="ml-auto" />}
        </MenuItem>
        {PRIORITIES.map((option) => (
          <MenuItem
            key={option.id}
            onClick={() => updateCard({ priority: option.id })}
          >
            <PriorityChip value={option.id} />
            {option.label}
            {option.id === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
