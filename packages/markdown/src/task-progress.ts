// Matches a GFM task-list marker at the start of a list item, e.g. "- [ ] ".
const TASK_RE = /^(\s*[-*+]\s+)\[([ xX])\]/gm

/** Counts completed / total task-list checkboxes in the markdown. */
export function taskProgress(markdown: string): {
  done: number
  total: number
} {
  let done = 0
  let total = 0
  for (const [, , mark] of markdown.matchAll(TASK_RE)) {
    total++
    if (mark.toLowerCase() === "x") done++
  }
  return { done, total }
}

/**
 * Toggles the checkbox of the task-list item at `index` (0-based, in document
 * order — the same order `taskProgress` counts them) and returns the new
 * markdown. Out-of-range indices leave the markdown unchanged.
 */
export function toggleTaskByIndex(markdown: string, index: number): string {
  let i = 0
  return markdown.replace(TASK_RE, (full, prefix, mark) => {
    if (i++ !== index) return full
    const next = mark.toLowerCase() === "x" ? " " : "x"
    return `${prefix}[${next}]`
  })
}
