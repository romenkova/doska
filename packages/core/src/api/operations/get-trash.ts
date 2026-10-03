import { RETENTION_MS } from "@doska/contract"
import { db } from "../db/db"
import { live } from "./live"
import type { TrashKind } from "./restore"

export interface TrashEntry {
  kind: TrashKind
  id: string
  title: string
  /** Where it was: the board, or the board and column, it came out of. */
  context: string
  deletedAt: number
  /** When the retention sweep will hard-delete it. */
  expiresAt: number
  /** How many cards come back with it; 0 for a card entry. */
  cardCount: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/** "29 days left" — rounded up, so the last day reads as a day rather than 0. */
export function expiryLabel(expiresAt: number): string {
  const days = Math.ceil((expiresAt - Date.now()) / DAY_MS)
  if (days <= 0) return "Deleting shortly"
  return days === 1 ? "1 day left" : `${days} days left`
}

/**
 * What the trash shows: one entry per deletion the user performed, newest
 * first.
 */
export async function getTrash(): Promise<TrashEntry[]> {
  const [dashboards, columns, cards] = await Promise.all([
    db.getDashboards(),
    db.getColumns(),
    db.getCards(),
  ])

  const boardById = new Map(dashboards.map((d) => [d.id, d]))
  const columnById = new Map(columns.map((c) => [c.id, c]))

  const cardsIn = (columnId: string) =>
    cards.filter((c) => c.columnId === columnId && !live(c)).length

  const entries: TrashEntry[] = []

  for (const dashboard of dashboards) {
    const deletedAt = dashboard.deletedAt
    if (deletedAt === null) continue
    const own = columns.filter((c) => c.dashboardId === dashboard.id)
    const cardCount = own.reduce((n, c) => n + cardsIn(c.id), 0)
    if (!dashboard.title.trim() && cardCount === 0) continue
    entries.push({
      kind: "dashboards",
      id: dashboard.id,
      title: dashboard.title || "Untitled board",
      context: "Board",
      deletedAt,
      expiresAt: deletedAt + RETENTION_MS,
      cardCount,
    })
  }

  for (const column of columns) {
    const deletedAt = column.deletedAt
    const board = boardById.get(column.dashboardId)
    if (deletedAt === null || !board || !live(board)) continue
    const cardCount = cardsIn(column.id)
    if (!column.title.trim() && cardCount === 0) continue
    entries.push({
      kind: "columns",
      id: column.id,
      title: column.title || "Untitled column",
      context: board.title || "Untitled board",
      deletedAt,
      expiresAt: deletedAt + RETENTION_MS,
      cardCount,
    })
  }

  for (const card of cards) {
    const deletedAt = card.deletedAt
    const column = columnById.get(card.columnId)
    const board = column && boardById.get(column.dashboardId)
    if (
      deletedAt === null ||
      !column ||
      !live(column) ||
      !board ||
      !live(board)
    )
      continue
    const files = card.attachments ?? []
    if (!card.title.trim() && !card.body.trim() && files.length === 0) continue
    entries.push({
      kind: "cards",
      id: card.id,
      title: card.title || "Untitled card",
      context: `${board.title || "Untitled board"} · ${column.title}`,
      deletedAt,
      expiresAt: deletedAt + RETENTION_MS,
      cardCount: 0,
    })
  }

  return entries.sort((a, b) => b.deletedAt - a.deletedAt)
}
