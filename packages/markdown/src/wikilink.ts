/**
 * A `[[target]]` wikilink, as in Obsidian, optionally carrying its own label
 */
export const WIKILINK_RE = /\[\[([^[\]\n|]+)(?:\|([^[\]\n]*))?\]\]/g

/** One link target offered by the `[[` menu. */
export interface WikilinkOption {
  id: string
  title: string
  hint?: string
  /** What lands in the text — the `12` in `[[12]]`. */
  target: string
}

// `[[` followed by the query up to the caret. The query may contain spaces —
// card titles do — but stops at a bracket or line break.
const WIKILINK_TRIGGER = /\[\[([^[\]\n]*)$/

export interface WikilinkTrigger {
  /** Index of the first `[`. */
  start: number
  query: string
}

/** The `[[` trigger the caret sits in, or null when there is none. */
export function matchWikilinkTrigger(
  value: string,
  caret: number
): WikilinkTrigger | null {
  const match = WIKILINK_TRIGGER.exec(value.slice(0, caret))
  if (!match) return null
  return { start: caret - match[1].length - 2, query: match[1] }
}

/**
 * Wraps a target in the wikilink syntax. An `alias` is written alongside it as
 * the label to display
 */
export function toWikilink(target: string, alias?: string): string {
  const label = alias?.trim()
  if (!label || label === target || /[[\]|\n]/.test(label))
    return `[[${target}]]`
  return `[[${target}|${label}]]`
}

/** Every target a body links to, in document order, without repeats. */
export function wikilinkTargetsIn(body: string): string[] {
  const targets = new Set<string>()
  for (const match of body.matchAll(WIKILINK_RE)) targets.add(match[1].trim())
  return [...targets]
}
