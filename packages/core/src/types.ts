import type { Card, Column } from "@doska/contract"

export type {
  Attachment,
  Card,
  Column,
  Dashboard,
  Member,
  SidebarItem,
  SidebarLayout,
} from "@doska/contract"

/** A board assembled for the UI: its columns and the cards that live in them. */
export type Board = {
  columns: Column[]
  cards: Card[]
}

/** How a board renders: its columns, or every card as one date-grouped list. */
export type DashboardView = "board" | "rows"
