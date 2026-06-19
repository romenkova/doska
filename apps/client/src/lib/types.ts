export type Card = {
  id: string
  title: string
  body: string
  position: number
  columnId: string
}

export type Column = {
  id: string
  title: string
  position: number
  dashboardId: string
}

export type Dashboard = {
  id: string
  title: string
  position: number
}

/** A board assembled for the UI: its columns and the cards that live in them. */
export type Board = {
  columns: Column[]
  cards: Card[]
}
