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
