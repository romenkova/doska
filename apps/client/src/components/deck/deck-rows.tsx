import { AnimatePresence } from "motion/react"
import { CalendarClock } from "lucide-react"
import type { DigestCard, DigestGroup as Group } from "@doska/core"
import { CenteredState } from "../digest/centered-state"
import { DigestGroup } from "../digest/digest-group"

interface IProps {
  groups: Group[]
  /** The card open in the panel, highlighted in the list. */
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}

/** The board as one list of rows, under the date headings it was grouped into. */
export function DeckRows({ groups, openCardId, onOpenCard }: IProps) {
  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto px-4 py-10">
      <div className="mx-auto max-w-lg">
        {groups.length === 0 ? (
          <CenteredState
            icon={<CalendarClock className="size-8 text-muted-foreground" />}
          >
            <p className="text-sm text-muted-foreground">
              This board has no cards yet.
            </p>
          </CenteredState>
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <DigestGroup
                key={`${group.kind}-${group.date}`}
                group={group}
                showBoard={false}
                openCardId={openCardId}
                onOpenCard={onOpenCard}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
