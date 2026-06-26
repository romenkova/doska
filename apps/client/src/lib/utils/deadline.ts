export type DeadlineStatus = "overdue" | "soon" | "upcoming"

/** Local `YYYY-MM-DD` for today, used as the reference point for the status. */
function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

/** Whole days from today to the deadline (negative once it's in the past). */
function daysUntil(iso: string): number {
  const today = new Date(todayIso()).getTime()
  const target = new Date(iso).getTime()
  return Math.round((target - today) / 86_400_000)
}

/** Buckets a deadline by how close it is, for color-coding. */
export function deadlineStatus(iso: string): DeadlineStatus {
  const days = daysUntil(iso)
  if (days < 0) return "overdue"
  if (days <= 2) return "soon"
  return "upcoming"
}

/** Renders an ISO date (`YYYY-MM-DD`) as `DD.MM.YYYY`. */
export function formatDeadline(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}.${month}.${year}`
}

/** A short relative label: how many days are left, or how long it's overdue. */
export function deadlineLabel(iso: string): string {
  const days = daysUntil(iso)
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  if (days === -1) return "yesterday"
  if (days > 1) return `${days} days left`
  return `${-days} days ago`
}
