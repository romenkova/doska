import { cn, deadlineLabel } from "@doska/ui-kit"
import type { DigestCard } from "@/lib/api/operations"
import { longDate, weekday } from "@/lib/utils"
import { DigestRow } from "./digest-row"
import type { Group } from "./group"

/** One date's heading and its cards. */
export function DigestGroup({
  date,
  entries,
  openCardId,
  onOpenCard,
}: Group & {
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}) {
  return (
    <section className="mb-10">
      <h2 className="flex items-baseline gap-2 pb-2">
        <span className={cn("text-md font-bold", !date && "text-destructive")}>
          {date ? longDate(date) : "Overdue"}
        </span>
        {date && (
          <>
            <span className="text-xs text-muted-foreground">
              {weekday(date)}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {deadlineLabel(date)}
            </span>
          </>
        )}
      </h2>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <DigestRow
            key={entry.card.id}
            entry={entry}
            isActive={entry.card.id === openCardId}
            onOpen={() => onOpenCard(entry)}
          />
        ))}
      </ul>
    </section>
  )
}
