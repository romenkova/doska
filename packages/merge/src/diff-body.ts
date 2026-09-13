import { diffLines } from "diff"
import { splitLines } from "./utils"

export type DiffLine = { kind: "same" | "added" | "removed"; text: string }

export function diffBody(ours: string, theirs: string): DiffLine[] {
  const out: DiffLine[] = []
  for (const part of diffLines(ours, theirs)) {
    const kind = part.added ? "added" : part.removed ? "removed" : "same"
    for (const text of splitLines(part.value)) out.push({ kind, text })
  }
  return out
}
