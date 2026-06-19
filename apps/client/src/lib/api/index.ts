import { generateKeyBetween } from "fractional-indexing"
import { BOARD_COLUMNS, fallbackCard } from "@/lib/seed"
import type { Board, Card, Dashboard } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { db } from "./db"
import { markDirty } from "./sync"

/** A record is live until it's tombstoned (see `deletedAt` in the contract). */
const live = <T extends { deletedAt: number | null }>(r: T) =>
  r.deletedAt === null

/** Every board's metadata, in sidebar order. */
export async function getDashboards(): Promise<Dashboard[]> {
  const list = await db.getDashboards()
  return list.filter(live).sort(byPosition)
}

/** A board's columns plus the cards that live in them. */
export async function getBoard(deckId: string): Promise<Board> {
  const columns = (await db.getColumns())
    .filter((c) => c.dashboardId === deckId && live(c))
    .sort(byPosition)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter(
    (c) => columnIds.has(c.columnId) && live(c)
  )
  return { columns, cards }
}

/** Creates a board with the default columns, appends it to the list, returns it. */
export async function createDashboard(name: string): Promise<Dashboard> {
  const id = `board-${crypto.randomUUID().slice(0, 8)}`
  const list = await db.getDashboards()
  const last = list.reduce<string | null>(
    (max, d) => (max === null || d.position > max ? d.position : max),
    null
  )
  const position = generateKeyBetween(last, null)
  const dashboard: Dashboard = {
    id,
    title: name,
    position,
    updatedAt: Date.now(),
    deletedAt: null,
  }
  await db.setDashboard(dashboard)
  markDirty("dashboards", id)

  await Promise.all(
    BOARD_COLUMNS.map(async (template) => {
      const column = {
        ...template,
        id: `col-${crypto.randomUUID().slice(0, 8)}`,
        dashboardId: id,
        updatedAt: Date.now(),
        deletedAt: null,
      }
      await db.setColumn(column)
      markDirty("columns", column.id)
    })
  )
  return dashboard
}

/** Renames a board. */
export async function renameDashboard(id: string, name: string): Promise<void> {
  const list = await db.getDashboards()
  const dashboard = list.find((d) => d.id === id)
  if (!dashboard) return
  await db.setDashboard({ ...dashboard, title: name, updatedAt: Date.now() })
  markDirty("dashboards", id)
}

/** Tombstones a board, its columns, and all of their cards. */
export async function deleteDashboard(id: string): Promise<void> {
  const now = Date.now()
  const dashboard = (await db.getDashboards()).find((d) => d.id === id)
  const columns = (await db.getColumns()).filter((c) => c.dashboardId === id)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter((c) => columnIds.has(c.columnId))

  await Promise.all([
    ...(dashboard
      ? [db.setDashboard({ ...dashboard, deletedAt: now, updatedAt: now })]
      : []),
    ...columns.map((c) =>
      db.setColumn({ ...c, deletedAt: now, updatedAt: now })
    ),
    ...cards.map((c) => db.setCard({ ...c, deletedAt: now, updatedAt: now })),
  ])

  markDirty("dashboards", id)
  for (const c of columns) markDirty("columns", c.id)
  for (const c of cards) markDirty("cards", c.id)
}

/** A single card (title + markdown body). */
export async function getCard(id: string): Promise<Card> {
  return (await db.getCard(id)) ?? fallbackCard
}

/** Creates an empty card at the top of a column and returns its new id. */
export async function createCard(
  _deckId: string,
  columnId: string
): Promise<string> {
  const id = `card-${crypto.randomUUID().slice(0, 8)}`
  const first = (await db.getCards())
    .filter((c) => c.columnId === columnId && live(c))
    .reduce<
      string | null
    >((min, c) => (min === null || c.position < min ? c.position : min), null)
  const position = generateKeyBetween(null, first)
  await db.setCard({
    ...fallbackCard,
    id,
    columnId,
    position,
    updatedAt: Date.now(),
    deletedAt: null,
  })
  markDirty("cards", id)
  return id
}

/** Updates a card's title/body, preserving its column and position. */
export async function updateCard(
  id: string,
  patch: Pick<Card, "title" | "body">
): Promise<void> {
  const existing = (await db.getCard(id)) ?? { ...fallbackCard, id }
  await db.setCard({ ...existing, ...patch, id, updatedAt: Date.now() })
  markDirty("cards", id)
}

/** Tombstones a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  const now = Date.now()
  await db.setCard({ ...existing, deletedAt: now, updatedAt: now })
  markDirty("cards", id)
}

/**
 * Persists cards whose column/position changed during a drag. Only the move is
 * applied: title/body are read back from the stored record so a concurrent edit
 * isn't clobbered by a stale copy from the board cache (the drag handler reads
 * cards from `keys.board`, which a rename doesn't invalidate).
 */
export async function moveCard(
  _deckId: string,
  changed: Card[]
): Promise<void> {
  const now = Date.now()
  await Promise.all(
    changed.map(async (card) => {
      const existing = await db.getCard(card.id)
      if (!existing) return
      await db.setCard({
        ...existing,
        columnId: card.columnId,
        position: card.position,
        updatedAt: now,
      })
    })
  )
  for (const card of changed) markDirty("cards", card.id)
}
