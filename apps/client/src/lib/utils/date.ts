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
