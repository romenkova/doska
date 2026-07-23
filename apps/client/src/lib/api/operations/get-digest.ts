import { addDays, todayIso } from "@doska/ui-kit"
import type { Card } from "@/lib/types"
import { db } from "../db/db"
import { live } from "./live"

/** Which slice of deadlines the digest shows. */
export type DigestFilter = "today" | "week"

/** A digest card carries the board and column it came from, since the digest
 * mixes cards from every board and can't infer either from context. */
export interface DigestCard {
  card: Card
  boardId: string
  boardTitle: string
  /** The board's card id prefix, for rendering `ROAD-12`. */
  prefix: string
  columnTitle: string
  /** Palette id tinting the column tag; empty when the column has none. */
  columnColor: string
  /** The card sits in its board's done column, so its deadline is settled. */
  isDone: boolean
}

/** Sorts below every real `YYYY-MM-DD`, so it opens an overdue range. */
const MIN_DATE = ""

/** How far ahead the upcoming range looks. */
const RANGE_DAYS = 60

/** Inclusive `[from, to]` deadline bounds of the upcoming range: today through
 * `RANGE_DAYS` out. */
export function upcomingBounds(): [string, string] {
  const today = todayIso()
  return [today, addDays(today, RANGE_DAYS)]
}

/** Inclusive `[from, to]` deadline bounds for a filter, as of today. The
 * upcoming range opens at the earliest deadline there is, so anything still
 * overdue shows ahead of today's cards. */
function bounds(filter: DigestFilter): [string, string] {
  const today = todayIso()
  if (filter === "today") return [today, today]
  return [MIN_DATE, upcomingBounds()[1]]
}

/**
 * Cards across every board whose deadline falls in the filter's range, in date
 * order. Reads the deadline index, so undated cards never enter and the result
 * needs no sort; the board and column each card belongs to are joined in from
 * the (small) columns and dashboards stores.
 */
export async function getDigest(filter: DigestFilter): Promise<DigestCard[]> {
  const [from, to] = bounds(filter)
  const [cards, columns, dashboards] = await Promise.all([
    db.getCardsByDeadline(from, to),
    db.getColumns(),
    db.getDashboards(),
  ])

  const columnById = new Map(columns.filter(live).map((c) => [c.id, c]))
  const boardById = new Map(dashboards.filter(live).map((d) => [d.id, d]))

  return cards.filter(live).flatMap((card) => {
    // A card whose column or board is tombstoned is gone from the UI's point of
    // view, even though its own record is still live.
    const column = columnById.get(card.columnId)
    const board = column && boardById.get(column.dashboardId)
    if (!column || !board) return []
    return [
      {
        card,
        boardId: board.id,
        boardTitle: board.title,
        prefix: board.prefix,
        columnTitle: column.title,
        columnColor: column.color,
        isDone: column.done,
      },
    ]
  })
}
