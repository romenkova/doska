import type { Card, Column } from "@doska/contract"

export type { Attachment, Card, Column, Dashboard } from "@doska/contract"

/** A board assembled for the UI: its columns and the cards that live in them. */
export type Board = {
  columns: Column[]
  cards: Card[]
}
