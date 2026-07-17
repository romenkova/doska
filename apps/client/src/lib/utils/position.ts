/**
 * Records ordered within a column/board carry a fractional-index `position`: a
 * string key that sorts lexicographically. To move a record you mint a key
 * *between* its new neighbors (see `fractional-indexing`), so a reorder touches
 * only the moved record instead of renumbering the whole list — which is what
 * lets two users reorder the same board concurrently without clobbering each
 * other's positions.
 */

/** Comparator that orders records by their fractional `position` key. */
export function byPosition<T extends { position: string }>(a: T, b: T): number {
  return a.position < b.position ? -1 : a.position > b.position ? 1 : 0
}

/**
 * Comparator that orders cards by deadline, earliest first; cards without a
 * deadline sort to the bottom. Deadlines are ISO `YYYY-MM-DD`, so lexicographic
 * order is chronological. Ties fall back to `position` for a stable order.
 */
export function byDeadline<
  T extends { deadline: string | null; position: string },
>(a: T, b: T): number {
  if (a.deadline !== b.deadline) {
    if (a.deadline === null) return 1
    if (b.deadline === null) return -1
    return a.deadline < b.deadline ? -1 : 1
  }
  return byPosition(a, b)
}
