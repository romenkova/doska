import { fallbackCard, type Card } from "@/lib/card-data"
import { BOARD_COLUMNS, type BoardItems, type Dashboard } from "@/lib/dashboards"
import { db } from "./db"
import { markDirty } from "./sync"

/** All card ids grouped by column for one board. */
export async function getBoard(deckId: string): Promise<BoardItems> {
  return (await db.getBoard(deckId)) ?? {}
}

/** Every board's metadata, in sidebar order. */
export async function getDashboards(): Promise<Dashboard[]> {
  return (await db.getDashboards()) ?? []
}

/** Creates an empty board, appends it to the list, and returns it. */
export async function createDashboard(name: string): Promise<Dashboard> {
  const dashboard: Dashboard = {
    id: `board-${crypto.randomUUID().slice(0, 8)}`,
    name,
    columns: BOARD_COLUMNS,
  }
  const list = (await db.getDashboards()) ?? []
  await db.setDashboards([...list, dashboard])
  await db.setBoard(dashboard.id, {})
  markDirty("dashboards", "list")
  markDirty("boards", dashboard.id)
  return dashboard
}

/** Renames a board. */
export async function renameDashboard(id: string, name: string): Promise<void> {
  const list = (await db.getDashboards()) ?? []
  await db.setDashboards(list.map((d) => (d.id === id ? { ...d, name } : d)))
  markDirty("dashboards", "list")
}

/** Removes a board, its arrangement, and all of its cards. */
export async function deleteDashboard(id: string): Promise<void> {
  const list = (await db.getDashboards()) ?? []
  await db.setDashboards(list.filter((d) => d.id !== id))

  const board = (await db.getBoard(id)) ?? {}
  const cardIds = Object.values(board).flat()
  await Promise.all(cardIds.map((cardId) => db.deleteCard(cardId)))
  await db.deleteBoard(id)

  markDirty("dashboards", "list")
  markDirty("boards", id)
  for (const cardId of cardIds) markDirty("cards", cardId)
}

/** A single card (title + markdown body). */
export async function getCard(id: string): Promise<Card> {
  return (await db.getCard(id)) ?? fallbackCard
}

/** Creates an empty card at the top of a column and returns its new id. */
export async function createCard(
  deckId: string,
  columnId: string
): Promise<string> {
  const id = `card-${crypto.randomUUID().slice(0, 8)}`
  await db.setCard(id, fallbackCard)
  const board = (await db.getBoard(deckId)) ?? {}
  await db.setBoard(deckId, {
    ...board,
    [columnId]: [id, ...(board[columnId] ?? [])],
  })
  markDirty("cards", id)
  markDirty("boards", deckId)
  return id
}

/** Replaces a card. */
export async function updateCard(id: string, card: Card): Promise<void> {
  await db.setCard(id, card)
  markDirty("cards", id)
}

/** Removes a card from its board and drops its content. */
export async function deleteCard(deckId: string, id: string): Promise<void> {
  const board = (await db.getBoard(deckId)) ?? {}
  const nextBoard: BoardItems = {}
  for (const [columnId, ids] of Object.entries(board)) {
    nextBoard[columnId] = ids.filter((cardId) => cardId !== id)
  }
  await db.setBoard(deckId, nextBoard)
  await db.deleteCard(id)
  markDirty("boards", deckId)
  markDirty("cards", id)
}

/** Persists a reordered/moved board. The caller computes the new arrangement. */
export async function moveCard(deckId: string, next: BoardItems): Promise<void> {
  await db.setBoard(deckId, next)
  markDirty("boards", deckId)
}
