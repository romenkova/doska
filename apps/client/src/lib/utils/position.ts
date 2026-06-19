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
