import {
  Button,
  SidebarTrigger,
  cn,
  deadlineLabel,
  todayIso,
} from "@doska/ui-kit"
import { CalendarClock, Check, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { type DigestCard, type DigestFilter } from "@/lib/api/operations"
import { DigestRow } from "./digest-row"

const FILTERS: { id: DigestFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Upcoming" },
]

const EMPTY: Record<DigestFilter, string> = {
  today: "Nothing due today.",
  week: "Nothing coming up.",
}

/** The day a date falls on, spelled out — the label people actually scan for.
 * Parsed as UTC to match `addDays`, so the weekday can't drift by a day. */
function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  })
}

/** A date as `21 August`, ordered by locale — the year tacked on only when it
 * isn't the current one. Parsed as UTC to match `weekday`. */
function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const sameYear = d.getUTCFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  })
}

interface Group {
  /** Group key, and the date its heading spells out — empty for the overdue
   * pile, which spans dates and gets a fixed heading instead. */
  date: string
  entries: DigestCard[]
}

/**
 * Consecutive runs of one date, with everything dated before `today` swept
 * into a single overdue group ahead of them. The query returns deadline order,
 * so a plain pass groups them — no sort, and no map keyed by date. Done cards
 * never enter the overdue pile: a finished card isn't a missed deadline.
 */
function group(entries: DigestCard[], today: string): Group[] {
  const overdue: DigestCard[] = []
  const groups: Group[] = []
  for (const entry of entries) {
    const date = entry.card.deadline ?? ""
    if (date < today) {
      if (!entry.isDone) overdue.push(entry)
      continue
    }
    const last = groups[groups.length - 1]
    if (last && last.date === date) last.entries.push(entry)
    else groups.push({ date, entries: [entry] })
  }
  if (overdue.length) groups.unshift({ date: "", entries: overdue })
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
  const [hideDone, setHideDone] = useState(false)
  const visible = hideDone ? entries.filter((e) => !e.isDone) : entries
  const groups = group(visible, todayIso())

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-11.5 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-base font-semibold">Upcoming</h1>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant={hideDone ? "secondary" : "ghost"}
            aria-pressed={hideDone}
            className={cn(!hideDone && "text-muted-foreground")}
            onClick={() => setHideDone((v) => !v)}
          >
            <Check />
            Hide done
          </Button>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-10 sm:px-4">
        <div className="mx-auto max-w-lg">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <TriangleAlert className="size-8 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Couldn't read your deadlines. If the app is open in another tab,
                close it and reload — the local database has to upgrade before
                the digest can read it.
              </p>
            </div>
          ) : isLoading ? null : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <CalendarClock className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{EMPTY[filter]}</p>
            </div>
          ) : (
            groups.map(({ date, entries }) => (
              <section key={date} className="mb-10">
                <h2 className="flex items-baseline gap-2 pb-2">
                  <span
                    className={cn(
                      "text-md font-bold",
                      !date && "text-destructive"
                    )}
                  >
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
