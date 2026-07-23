import { CalendarClock, TriangleAlert } from "lucide-react"
import type { DigestCard, DigestFilter } from "@/lib/api/operations"
import { CenteredState } from "./centered-state"
import { DigestGroup } from "./digest-group"
import type { Group } from "./group"

const EMPTY: Record<DigestFilter, string> = {
  today: "Nothing due today.",
  week: "Nothing coming up.",
}

/** The scrollable content: a failure, nothing, or the grouped list. */
export function DigestBody({
  error,
  isLoading,
  groups,
  filter,
  openCardId,
  onOpenCard,
}: {
  error: Error | null
  isLoading: boolean
  groups: Group[]
  filter: DigestFilter
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}) {
  if (error)
    return (
      <CenteredState icon={<TriangleAlert className="size-8 text-destructive" />}>
        <p className="max-w-sm text-sm text-muted-foreground">
          Couldn't read your deadlines. If the app is open in another tab, close
          it and reload — the local database has to upgrade before the digest
          can read it.
        </p>
      </CenteredState>
    )

  if (isLoading) return null

  if (groups.length === 0)
    return (
      <CenteredState
        icon={<CalendarClock className="size-8 text-muted-foreground" />}
      >
        <p className="text-sm text-muted-foreground">{EMPTY[filter]}</p>
      </CenteredState>
    )

  return (
    <>
      {groups.map((g) => (
        <DigestGroup
          key={g.date}
          {...g}
          openCardId={openCardId}
          onOpenCard={onOpenCard}
        />
      ))}
    </>
  )
}
