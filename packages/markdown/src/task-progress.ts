// Matches a GFM task-list marker at the start of a list item, e.g. "- [ ] ".
const TASK_RE = /^(\s*[-*+]\s+)\[([ xX])\]/gm
const LINE_TASK_RE = new RegExp(TASK_RE.source)
const BULLET_RE = /^(\s*)([-*+]\s+)?/

export interface TaskProgress {
  done: number
  total: number
}

export interface LineEdit {
  from: number
  to: number
  insert: string
}

function flip(mark: string): string {
  return mark.toLowerCase() === "x" ? " " : "x"
}

/** Counts completed / total task-list checkboxes in the markdown. */
export function taskProgress(markdown: string): TaskProgress {
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
    return `${prefix}[${flip(mark)}]`
  })
}

export function toggleTaskLine(line: string): LineEdit {
  const task = LINE_TASK_RE.exec(line)
  if (task) {
    const box = task[1].length + 1
    return { from: box, to: box + 1, insert: flip(task[2]) }
  }

  const [, indent, bullet] = BULLET_RE.exec(line)!
  if (bullet) {
    const at = indent.length + bullet.length
    return { from: at, to: at, insert: "[ ] " }
  }
  return { from: indent.length, to: indent.length, insert: "- [ ] " }
}
