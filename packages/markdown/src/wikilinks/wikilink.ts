import type { MenuItem } from "../menu"

/**
 * A `[[target]]` wikilink, as in Obsidian. The syntax is all this package
 * knows — what a target names, and what it renders as, belongs to the host
 * app; see the `renderWikilink` renderer.
 */
export const WIKILINK_RE = /\[\[([^[\]\n]+)\]\]/g

/** One link target offered by the `[[` menu. */
export interface WikilinkOption extends MenuItem {
  /** What lands in the text — the `ROAD-12` in `[[ROAD-12]]`. */
  target: string
}

/** Wraps a target in the wikilink syntax. */
export function toWikilink(target: string): string {
  return `[[${target}]]`
}

/** Every target a body links to, in document order, without repeats. */
export function wikilinkTargetsIn(body: string): string[] {
  const targets = new Set<string>()
  for (const match of body.matchAll(WIKILINK_RE)) targets.add(match[1].trim())
  return [...targets]
}

/**
 * Filters the `[[` menu: matches the target or the title, so either route
 * finds a link.
 */
export function filterWikilinks(
  options: WikilinkOption[],
  query: string
): WikilinkOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter(
    (option) =>
      option.target.toLowerCase().includes(q) ||
      option.title.toLowerCase().includes(q)
  )
}
