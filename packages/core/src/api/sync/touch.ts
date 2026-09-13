import {
  CARD_GROUPS,
  COLUMN_GROUPS,
  type CardGroup,
  type ColumnGroup,
} from "@doska/contract"
import type { Card, Column } from "../../types"
import { stamp } from "./hlc"

type Stamped<G extends string> = {
  updatedAt: number
  stamps: Partial<Record<G, number>>
}

/**
 * Stamps `groups` at `at` and moves `updatedAt` up with them. The other groups
 * are pinned at the old `updatedAt` first: a missing stamp reads as `updatedAt`,
 * so left missing they would ride up too.
 */
function touch<G extends string, T extends Stamped<G>>(
  record: T,
  all: readonly G[],
  groups: readonly G[],
  at: number
): T {
  const stamps: Partial<Record<G, number>> = {}
  for (const group of all)
    stamps[group] = record.stamps[group] ?? record.updatedAt
  for (const group of groups) stamps[group] = at
  return { ...record, stamps, updatedAt: Math.max(record.updatedAt, at) }
}

export function touchCard(
  card: Card,
  groups: readonly CardGroup[],
  at = stamp()
): Card {
  return touch(card, CARD_GROUPS, groups, at)
}

export function touchColumn(
  column: Column,
  groups: readonly ColumnGroup[],
  at = stamp()
): Column {
  return touch(column, COLUMN_GROUPS, groups, at)
}
