import type { Card } from "@doska/contract"
import { mergeBody } from "@doska/merge"
import type { cards } from "../../schema"

export type CardRow = typeof cards.$inferSelect

/**
 * The body 3-way merge on top of a per-group merge
 */
export function mergeCardBody(
  stored: CardRow,
  incoming: CardRow,
  baseBody: string,
  merged: CardRow
): { record: CardRow; changed: boolean } {
  const storedStamp = stampOf(stored, "body")
  const incomingStamp = stampOf(incoming, "body")
  const incomingIsNewer = incomingStamp > storedStamp
  const ours = incomingIsNewer ? incoming.body : stored.body
  const theirs = incomingIsNewer ? stored.body : incoming.body
  const result = mergeBody(baseBody, ours, theirs)
  const newest = Math.max(storedStamp, incomingStamp)

  const record = { ...merged, body: result.body }
  const stamps = { ...merged.stamps }
  let changed = result.body !== stored.body

  // Past both sides, or the pushing client's own copy would tie on pull and
  // the merged text would never reach it.
  if (result.body !== incoming.body) stamps.body = newest + 1

  if (result.conflict) {
    changed = true
    record.bodyConflict = { body: theirs, at: newest }
    stamps.conflict = Math.max(stampOf(merged, "conflict"), newest) + 1
  }

  record.stamps = stamps
  record.updatedAt = Math.max(...Object.values(stamps))
  return { record, changed }
}

/** A group with no stamp reads as the record's `updatedAt`. */
function stampOf(
  card: Pick<CardRow, "stamps" | "updatedAt">,
  group: keyof Card["stamps"]
): number {
  return card.stamps[group] ?? card.updatedAt
}
