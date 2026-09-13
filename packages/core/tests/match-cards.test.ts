import { describe, expect, it } from "vitest"
import { searchCards } from "../src/search"
import type { Card, Column } from "../src/types"

function column(id: string, position: string): Column {
  return {
    id,
    title: id,
    position,
    dashboardId: "board",
    collapsed: false,
    color: "",
    done: false,
    updatedAt: 0,
    deletedAt: null,
    stamps: {},
  }
}

function card(fields: Partial<Card> & { id: string }): Card {
  return {
    title: "",
    body: "",
    position: "a",
    columnId: "todo",
    number: 1,
    deadline: null,
    priority: "",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    stamps: {},
    bodyConflict: null,
    ...fields,
  }
}

const columns = [column("todo", "a"), column("done", "b")]

const hitIds = (cards: Card[], query: string, limit?: number) =>
  searchCards({ cards, columns, query, limit }).map(({ card: hit }) => hit.id)

describe("searchCards", () => {
  it("puts an exact number match above a title holding the same digits", () => {
    const cards = [
      card({ id: "titled", number: 7, title: "release 12 notes" }),
      card({ id: "numbered", number: 12, title: "unrelated" }),
    ]

    expect(hitIds(cards, "12")).toEqual(["numbered", "titled"])
    // Stripping the old prefix only applies to the number field, so `road-12`
    // leaves the card whose title merely reads `12` behind.
    expect(hitIds(cards, "road-12")).toEqual(["numbered"])
  })

  it("cannot match the number of a card that has never synced", () => {
    const cards = [card({ id: "unsynced", number: null, title: "unrelated" })]

    expect(hitIds(cards, "12")).toEqual([])
  })

  it("breaks ties in board order, not input order", () => {
    const cards = [
      card({ id: "c", columnId: "done", position: "a", title: "sync" }),
      card({ id: "b", columnId: "todo", position: "b", title: "sync" }),
      card({ id: "a", columnId: "todo", position: "a", title: "sync" }),
    ]

    expect(hitIds(cards, "sync")).toEqual(["a", "b", "c"])
  })

  it("returns a title-only match with no snippet", () => {
    const cards = [card({ id: "a", title: "sync bug", body: "no mention" })]
    const [hit] = searchCards({ cards, columns, query: "sync" })

    expect(hit.snippet).toBeNull()
    expect(hit.title).toEqual([
      { text: "sync", hit: true },
      { text: " bug", hit: false },
    ])
    expect(hit.column).toBe(columns[0])
  })

  it("snippets the first body line that matched", () => {
    const cards = [
      card({ id: "a", title: "x", body: "intro\n  the sync   bug lives here" }),
    ]
    const [hit] = searchCards({ cards, columns, query: "sync" })

    expect(hit.snippet).toEqual([
      { text: "the ", hit: false },
      { text: "sync", hit: true },
      { text: " bug lives here", hit: false },
    ])
  })

  it("matches the body's markup, not just its prose", () => {
    const cards = [
      card({ id: "link", title: "x", body: "see [the docs](https://sync.dev)" }),
      card({ id: "ref", title: "y", body: "blocked by [[ROAD-12]]" }),
    ]

    expect(hitIds(cards, "sync.dev")).toEqual(["link"])
    expect(hitIds(cards, "road-12")).toEqual(["ref"])
  })

  it("matches attachment names", () => {
    const cards = [
      card({
        id: "a",
        title: "x",
        attachments: [
          {
            id: "att",
            name: "sync-notes.pdf",
            key: "att/00000000-0000-0000-0000-000000000000.pdf",
            mime: "application/pdf",
            size: 1,
          },
        ],
      }),
    ]
    const [hit] = searchCards({ cards, columns, query: "sync-notes" })

    expect(hit.card.id).toBe("a")
    expect(hit.snippet).toEqual([
      { text: "sync-notes", hit: true },
      { text: ".pdf", hit: false },
    ])
  })

  it("searches a card stored before attachments existed", () => {
    const legacy = card({ id: "a", title: "sync" })
    delete (legacy as Partial<Card>).attachments

    expect(hitIds([legacy], "sync")).toEqual(["a"])
  })

  it("truncates to limit", () => {
    const cards = [
      card({ id: "a", title: "sync" }),
      card({ id: "b", title: "sync", position: "b" }),
    ]

    expect(hitIds(cards, "sync", 1)).toEqual(["a"])
  })
})
