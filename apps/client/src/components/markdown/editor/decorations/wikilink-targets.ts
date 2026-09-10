import { Facet } from "@codemirror/state"

/**
 * Wikilink targets that resolve to a real card
 */
export const wikilinkTargets = Facet.define<Set<string>, Set<string>>({
  combine: (values) => values[0] ?? new Set(),
})

/**
 * Backwards compat with prefixed wikilinks like DSK-11
 */
export function normalizeTarget(target: string): string {
  const text = target.trim().toLowerCase()
  return text.slice(text.indexOf("-") + 1)
}
