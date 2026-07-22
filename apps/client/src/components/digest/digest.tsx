import {
  Button,
  SidebarTrigger,
  cn,
  deadlineLabel,
  deadlineStatus,
  formatDeadline,
} from "@doska/ui-kit"
import { CalendarClock, TriangleAlert } from "lucide-react"
import {
  type DigestCard,
  type DigestFilter,
  weekBounds,
} from "@/lib/api/operations"
import { DigestRow } from "./digest-row"

const FILTERS: { id: DigestFilter; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
]

const EMPTY: Record<DigestFilter, string> = {
  overdue: "Nothing overdue.",
  today: "Nothing due today.",
  week: "Nothing due this week.",
}

/** The day a date falls on, spelled out — the label people actually scan for.
 * Parsed as UTC to match `addDays`, so the weekday can't drift by a day. */
function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  })
}

/** The week filter names its range, since it spans days already past. */
function title(filter: DigestFilter): string {
  if (filter !== "week") return "Digest"
  const [from, to] = weekBounds()
  return `Week ${formatDeadline(from)} – ${formatDeadline(to)}`
}

/** Consecutive runs of one date. The query returns deadline order, so a plain
 * pass groups them — no sort, and no map keyed by date to re-order afterwards. */
function groupByDate(entries: DigestCard[]) {
  const groups: { date: string; entries: DigestCard[] }[] = []
  for (const entry of entries) {
    const date = entry.card.deadline ?? ""
    const last = groups[groups.length - 1]
    if (last && last.date === date) last.entries.push(entry)
    else groups.push({ date, entries: [entry] })
  }
  return groups
}

interface IProps {
  filter: DigestFilter
  onChangeFilter: (filter: DigestFilter) => void
  entries: DigestCard[]
  isLoading: boolean
  /** A failed read renders as a failure, not as an empty week. */
  error: Error | null
  /** The card open in the panel, highlighted in the list. */
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}

/** Every deadlined card across every board, in date order. */
export function Digest({
  filter,
  onChangeFilter,
  entries,
  isLoading,
  error,
  openCardId,
  onOpenCard,
}: IProps) {
  const groups = groupByDate(entries)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-11.5 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-base font-semibold">{title(filter)}</h1>
        <div className="ml-auto flex items-center gap-1">
          {FILTERS.map(({ id, label }) => (
            <Button
              key={id}
              size="sm"
              variant={id === filter ? "secondary" : "ghost"}
              aria-pressed={id === filter}
              className={cn(id !== filter && "text-muted-foreground")}
              onClick={() => onChangeFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </header>

      <div className="min-h-0 max-w-xl flex-1 overflow-y-auto px-2 py-3 sm:px-4">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <TriangleAlert className="size-8 text-destructive" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Couldn't read your deadlines. If the app is open in another tab,
              close it and reload — the local database has to upgrade before the
              digest can read it.
            </p>
          </div>
        ) : isLoading ? null : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <CalendarClock className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{EMPTY[filter]}</p>
          </div>
        ) : (
          groups.map(({ date, entries }) => (
            <section key={date} className="mb-6">
              <h2 className="flex items-baseline gap-2 px-3 pb-1.5">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    deadlineStatus(date) === "overdue" && "text-destructive"
                  )}
                >
                  {weekday(date)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDeadline(date)}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {deadlineLabel(date)}
                </span>
              </h2>
              <ul className="space-y-2">
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
          ))
        )}
      </div>
    </div>
  )
}
