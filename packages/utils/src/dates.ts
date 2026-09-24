// Deadlines are plain `YYYY-MM-DD` calendar dates. This package keeps no
// runtime dependencies so the server can load it as freely as the clients.

export type DeadlineStatus = "overdue" | "soon" | "upcoming"

/** How far ahead the app's upcoming view looks. */
export const UPCOMING_DAYS = 60

/** Local `YYYY-MM-DD` for today, the reference point for every status below. */
export function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

/** The `YYYY-MM-DD` `days` away from `iso`. Parsed as UTC and shifted in UTC, so
 * a DST boundary can't land the result on the wrong calendar day. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
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
  if (days <= 3) return "soon"
  return "upcoming"
}

/** A soon deadline reads as relative time ("in 3 days") rather than a date. */
export function deadlineRelative(iso: string): string {
  const days = daysUntil(iso)
  if (days === -1) return "yesterday"
  if (days < 0) return `${-days} days ago`
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  return `in ${days} days`
}

/** Renders an ISO date (`YYYY-MM-DD`) as `DD.MM.YYYY`. */
export function formatDeadline(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}.${month}.${year}`
}

/** Same as `formatDeadline`, but drops the year when it's the current one. */
export function formatDeadlineShort(iso: string): string {
  const [year, month, day] = iso.split("-")
  const sameYear = Number(year) === new Date().getFullYear()
  return sameYear ? `${day}.${month}` : `${day}.${month}.${year}`
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

/** The day a date falls on, spelled out — the label people actually scan for.
 * Parsed as UTC to match `addDays`, so the weekday can't drift by a day. */
export function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  })
}

/** A date as `21 August`, ordered by locale — the year tacked on only when it
 * isn't the current one. Parsed as UTC to match `weekday`. */
export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const sameYear = d.getUTCFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  })
}
