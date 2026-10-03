import { priorityRank } from "@doska/tokens"
import { UPCOMING_DAYS } from "@doska/utils"
import type { Board, Card, Column } from "../../types"
import { addDays, byPosition, todayIso } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"

export type DigestFilter = "today" | "week"

export interface DigestCard {
  card: Card
  /** The column the card sits in, so the digest can draw a real board card. */
  column: Column
  boardId: string
  boardTitle: string
  columnTitle: string
  columnColor: string
  isDone: boolean
  /** Where ticking the row's checkbox sends the card; null if the board has no done column. */
  doneColumnId: string | null
  /** Where un-ticking sends it: the board's leftmost non-done column. */
  undoneColumnId: string | null
}

type Targets = { doneColumnId: string | null; undoneColumnId: string | null }

/**
 * Each board's tick and un-tick destinations. One sort across all boards is
 * enough: positions only order columns within a board, so interleaving is fine.
 */
function targetsByBoard(columns: Column[]) {
  const targets = new Map<string, Targets>()
  for (const column of [...columns].sort(byPosition)) {
    let board = targets.get(column.dashboardId)
    if (!board) {
      board = { doneColumnId: null, undoneColumnId: null }
      targets.set(column.dashboardId, board)
    }
    if (column.done) board.doneColumnId ??= column.id
    else board.undoneColumnId ??= column.id
  }
  return targets
}

/** Sorts below every real `YYYY-MM-DD`, so it opens an overdue range. */
const MIN_DATE = ""

/** Inclusive `[from, to]` deadline bounds of the upcoming range: today through
 * `UPCOMING_DAYS` out. */
export function upcomingBounds(): [string, string] {
  const today = todayIso()
  return [today, addDays(today, UPCOMING_DAYS)]
}

/** Inclusive `[from, to]` deadline bounds for a filter, as of today.*/
function bounds(filter: DigestFilter): [string, string] {
  const today = todayIso()
  if (filter === "today") return [today, today]
  return [MIN_DATE, upcomingBounds()[1]]
}

/**
 * Cards across every board whose deadline falls in the filter's range, in date
 * order.
 */
export async function getDigest(filter: DigestFilter): Promise<DigestCard[]> {
  const [from, to] = bounds(filter)
  const [cards, columns, dashboards] = await Promise.all([
    db.getCardsByDeadline(from, to),
    db.getColumns(),
    db.getDashboards(),
  ])

  const liveColumns = columns.filter(live)
  const columnById = new Map(liveColumns.map((c) => [c.id, c]))
  const boardById = new Map(dashboards.filter(live).map((d) => [d.id, d]))
  const targets = targetsByBoard(liveColumns)

  return cards.filter(live).flatMap((card) => {
    // A card whose column or board is tombstoned is gone from the UI's point of
    // view, even though its own record is still live.
    const column = columnById.get(card.columnId)
    const board = column && boardById.get(column.dashboardId)
    if (!column || !board) return []
    return [
      {
        card,
        column,
        boardId: board.id,
        boardTitle: board.title,
        columnTitle: column.title,
        columnColor: column.color,
        isDone: column.done,
        doneColumnId: targets.get(board.id)?.doneColumnId ?? null,
        undoneColumnId: targets.get(board.id)?.undoneColumnId ?? null,
      },
    ]
  })
}

export interface DigestGroup {
  /** `overdue` leads the list, `undated` closes it; both carry an empty `date`. */
  kind: "overdue" | "date" | "undated"
  /** The group's deadline, empty for the `overdue` and `undated` piles. */
  date: string
  entries: DigestCard[]
}

/**
 * Priority, then the card's number.
 */
function byPriority(a: DigestCard, b: DigestCard): number {
  const rank = priorityRank(a.card.priority) - priorityRank(b.card.priority)
  if (rank !== 0) return rank
  const numberA = a.card.number ?? Infinity
  const numberB = b.card.number ?? Infinity
  if (numberA !== numberB) return numberA - numberB
  return a.card.id < b.card.id ? -1 : 1
}

/**
 * Consecutive runs of one date, with everything dated before `today` swept
 * into a single overdue group ahead of them. `getDigest` returns deadline
 * order, so a plain pass groups them — no sort, and no map keyed by date. Done
 * cards never enter the overdue pile: a finished card isn't a missed deadline.
 * Each group is then ordered by priority alone.
 */
export function groupByDeadline(
  entries: DigestCard[],
  today = todayIso()
): DigestGroup[] {
  const overdue: DigestCard[] = []
  const groups: DigestGroup[] = []
  for (const entry of entries) {
    const date = entry.card.deadline ?? ""
    if (date < today) {
      if (!entry.isDone) overdue.push(entry)
      continue
    }
    const last = groups[groups.length - 1]
    if (last && last.date === date) last.entries.push(entry)
    else groups.push({ kind: "date", date, entries: [entry] })
  }
  if (overdue.length)
    groups.unshift({ kind: "overdue", date: "", entries: overdue })
  for (const group of groups) group.entries.sort(byPriority)
  return groups
}

/**
 * Every live card on one board as digest entries. The board's columns and cards
 * are already loaded for the deck, so this is a transform rather than a read —
 * unlike {@link getDigest}, which spans every board and has to go to the DB.
 */
export function boardDigest(board: Board, boardTitle: string): DigestCard[] {
  const columnById = new Map(board.columns.map((c) => [c.id, c]))
  const targets = targetsByBoard(board.columns)
  return board.cards.flatMap((card) => {
    const column = columnById.get(card.columnId)
    if (!column) return []
    const boardId = column.dashboardId
    return [
      {
        card,
        column,
        boardId,
        boardTitle,
        columnTitle: column.title,
        columnColor: column.color,
        isDone: column.done,
        doneColumnId: targets.get(boardId)?.doneColumnId ?? null,
        undoneColumnId: targets.get(boardId)?.undoneColumnId ?? null,
      },
    ]
  })
}

/**
 * The row view's groups: deadlined cards grouped as in the digest, then
 * everything without a deadline in one pile at the end. Undated cards are split
 * off first, because {@link groupByDeadline} reads a missing deadline as `""`
 * and would sweep them into the overdue pile.
 */
export function groupBoardCards(
  entries: DigestCard[],
  today = todayIso()
): DigestGroup[] {
  const dated: DigestCard[] = []
  const undated: DigestCard[] = []
  for (const entry of entries) {
    if (entry.card.deadline) dated.push(entry)
    else undated.push(entry)
  }
  dated.sort((a, b) => {
    const dateA = a.card.deadline ?? ""
    const dateB = b.card.deadline ?? ""
    if (dateA === dateB) return 0
    return dateA < dateB ? -1 : 1
  })
  const groups = groupByDeadline(dated, today)
  if (undated.length) {
    undated.sort(byPriority)
    groups.push({ kind: "undated", date: "", entries: undated })
  }
  return groups
}
