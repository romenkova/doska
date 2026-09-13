import type { DiffLine } from "@doska/merge"

export type DiffRow = DiffLine | { kind: "gap" }

/**
 * Changed lines with `context` unchanged lines around them; a longer unchanged
 * run between hunks folds into one gap. Leading and trailing runs just go.
 */
export function diffHunks(lines: DiffLine[], context: number): DiffRow[] {
  const near = lines.map((_, i) =>
    lines
      .slice(Math.max(0, i - context), i + context + 1)
      .some((line) => line.kind !== "same")
  )

  const rows: DiffRow[] = []
  let inGap = false
  lines.forEach((line, i) => {
    if (near[i]) {
      rows.push(line)
      inGap = false
    } else if (!inGap) {
      rows.push({ kind: "gap" })
      inGap = true
    }
  })
  if (rows[0]?.kind === "gap") rows.shift()
  if (rows.at(-1)?.kind === "gap") rows.pop()
  return rows
}
