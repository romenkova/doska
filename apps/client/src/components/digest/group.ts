import type { DigestCard } from "@/lib/api/operations"

export interface Group {
  date: string
  entries: DigestCard[]
}

/**
 * Consecutive runs of one date, with everything dated before `today` swept
 * into a single overdue group ahead of them. The query returns deadline order,
 * so a plain pass groups them — no sort, and no map keyed by date. Done cards
 * never enter the overdue pile: a finished card isn't a missed deadline.
 */
export function group(entries: DigestCard[], today: string): Group[] {
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
