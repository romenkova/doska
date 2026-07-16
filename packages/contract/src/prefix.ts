/**
 * Card-id helpers shared by the client and the MCP server, kept here so both
 * derive prefixes and compose display ids the same way.
 */

/**
 * Derives a board's card-id prefix from its title — the `ROAD` in `ROAD-12`.
 * Takes the initials of a multi-word title, else the leading letters of a single
 * word; uppercased and capped at 4 chars (`BOARD` when the title has no letters
 * or digits). Appends `2`, `3`, … to sidestep any prefix already in `taken`,
 * so the result is unique against the boards the caller knows about.
 */
export function derivePrefix(
  title: string,
  taken: Iterable<string> = []
): string {
  const used = new Set([...taken].filter(Boolean).map((p) => p.toUpperCase()))
  const words = title.match(/[A-Za-z0-9]+/g) ?? []
  const raw = words.length >= 2 ? words.map((w) => w[0]).join("") : (words[0] ?? "")
  const base = raw.toUpperCase().slice(0, 4) || "BOARD"

  let candidate = base
  for (let n = 2; used.has(candidate); n++) candidate = `${base}${n}`
  return candidate
}

/**
 * The human-readable card id (`ROAD-12`), or `null` when it can't be formed yet
 * — a card has no `number` until the server stamps it on first sync, and a
 * board created before this feature may have no `prefix`.
 */
export function cardDisplayId(
  prefix: string,
  number: number | null
): string | null {
  if (number == null || !prefix) return null
  return `${prefix}-${number}`
}
