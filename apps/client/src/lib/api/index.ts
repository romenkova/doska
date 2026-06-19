import { BOARD_COLUMNS, fallbackCard } from "@/lib/seed"
import type { Board, Card, Dashboard } from "@/lib/types"
import { db } from "./db"
import { markDirty } from "./sync"

/** Every board's metadata, in sidebar order. */
export async function getDashboards(): Promise<Dashboard[]> {
  const list = await db.getDashboards()
  return list.sort((a, b) => a.position - b.position)
}

/** A board's columns plus the cards that live in them. */
export async function getBoard(deckId: string): Promise<Board> {
  const columns = (await db.getColumns())
    .filter((c) => c.dashboardId === deckId)
    .sort((a, b) => a.position - b.position)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter((c) => columnIds.has(c.columnId))
  return { columns, cards }
}

/** Creates a board with the default columns, appends it to the list, returns it. */
export async function createDashboard(name: string): Promise<Dashboard> {
  const id = `board-${crypto.randomUUID().slice(0, 8)}`
  const list = await db.getDashboards()
  const position = list.reduce((max, d) => Math.max(max, d.position), -1) + 1
  const dashboard: Dashboard = { id, title: name, position }
  await db.setDashboard(dashboard)
  markDirty("dashboards", id)

  await Promise.all(
    BOARD_COLUMNS.map(async (template) => {
      const column = {
        ...template,
        id: `col-${crypto.randomUUID().slice(0, 8)}`,
        dashboardId: id,
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
  await db.setDashboard({ ...dashboard, title: name })
  markDirty("dashboards", id)
}

/** Removes a board, its columns, and all of their cards. */
export async function deleteDashboard(id: string): Promise<void> {
  const columns = (await db.getColumns()).filter((c) => c.dashboardId === id)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter((c) => columnIds.has(c.columnId))

  await Promise.all([
    db.deleteDashboard(id),
    ...columns.map((c) => db.deleteColumn(c.id)),
    ...cards.map((c) => db.deleteCard(c.id)),
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
  const min = (await db.getCards())
    .filter((c) => c.columnId === columnId)
    .reduce((min, c) => Math.min(min, c.position), 0)
  await db.setCard({ ...fallbackCard, id, columnId, position: min - 1 })
  markDirty("cards", id)
  return id
}

/** Updates a card's title/body, preserving its column and position. */
export async function updateCard(
  id: string,
  patch: Pick<Card, "title" | "body">
): Promise<void> {
  const existing = (await db.getCard(id)) ?? { ...fallbackCard, id }
  await db.setCard({ ...existing, ...patch, id })
  markDirty("cards", id)
}

/** Removes a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  await db.deleteCard(id)
  markDirty("cards", id)
}

/** Persists cards whose column/position changed during a drag. */
export async function moveCard(_deckId: string, changed: Card[]): Promise<void> {
  await Promise.all(changed.map((card) => db.setCard(card)))
  for (const card of changed) markDirty("cards", card.id)
}
