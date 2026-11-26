import type { Card, Column } from "../types"
import { groupCardsByColumn } from "../utils/group-cards"
import { queryTerms, rankBy, segment, type Segment } from "./rank"

export interface SearchHit {
  card: Card
  column: Column | undefined
  score: number
  title: Segment[]
  snippet: Segment[] | null
}

const SNIPPET_LENGTH = 120
/** Characters of context kept before the match when the line has to be cut. */
const SNIPPET_LEAD = 30

/** Board order, so `rankBy`'s stable sort brings ties back in board order. */
function inBoardOrder(cards: Card[], columns: Column[]): Card[] {
  const grouped = groupCardsByColumn({ columns, cards })
  const ordered = grouped.flatMap((group) => group.cards)
  const placed = new Set(ordered.map((card) => card.id))
  return [...ordered, ...cards.filter((card) => !placed.has(card.id))]
}

/** The raw body, markup and all, plus the names of the files hanging off it. */
function searchable(card: Card): string {
  // Cards predating the attachments field come back from IndexedDB without it —
  // reads are raw casts, so the schema's `.default([])` never runs.
  const names = (card.attachments ?? []).map((attachment) => attachment.name)
  return [card.body, ...names].join("\n")
}

function snippetFor(body: string, terms: string[]): Segment[] | null {
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\s+/g, " ").trim()
    const haystack = line.toLowerCase()
    const hits = terms
      .map((term) => haystack.indexOf(term))
      .filter((at) => at !== -1)
    if (hits.length === 0) continue

    const start = Math.max(0, Math.min(...hits) - SNIPPET_LEAD)
    const end = start + SNIPPET_LENGTH
    const text = `${start > 0 ? "…" : ""}${line.slice(start, end)}${end < line.length ? "…" : ""}`
    return segment(text, terms)
  }
  return null
}

export function searchCards(input: {
  cards: Card[]
  columns: Column[]
  query: string
  limit?: number
}): SearchHit[] {
  const { cards, columns, query, limit = 50 } = input
  const terms = queryTerms(query)
  const byId = new Map(columns.map((column) => [column.id, column]))

  const ranked = rankBy(inBoardOrder(cards, columns), query, (card) => ({
    number: card.number == null ? undefined : String(card.number),
    title: card.title,
    body: searchable(card),
  }))

  const archivedLast = [
    ...ranked.filter(({ item }) => !item.archived),
    ...ranked.filter(({ item }) => item.archived),
  ]

  return archivedLast.slice(0, limit).map(({ item: card, score }) => ({
    card,
    column: byId.get(card.columnId),
    score,
    title: segment(card.title, terms),
    snippet: snippetFor(searchable(card), terms),
  }))
}
