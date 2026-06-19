import type { Card, Column } from "@deck/contract"

export type { Card, Column, Dashboard } from "@deck/contract"

/** A board assembled for the UI: its columns and the cards that live in them. */
export type Board = {
  columns: Column[]
  cards: Card[]
}
