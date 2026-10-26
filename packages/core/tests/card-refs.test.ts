import { beforeEach, describe, expect, it } from "vitest"
import { toWikilink } from "@doska/markdown/core"
import { CARDS, COLUMNS } from "../src/api/constants"
import {
  findCardByRef,
  referenceable,
  resolveCardRef,
} from "../src/data/card-refs"
import type { Card } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const column = (id: string, dashboardId: string) => ({
  id,
  title: `${id} title`,
  dashboardId,
  position: "a0",
  collapsed: false,
  done: false,
  color: "",
  stamps: { title: 1 },
  updatedAt: 1,
  deletedAt: null,
})

const card = (id: string, columnId: string, patch: Partial<Card> = {}) => ({
  id,
  columnId,
  position: "a0",
  title: id,
  body: "",
  number: null,
  deadline: null,
  priority: null,
  tags: [],
  users: [],
  attachments: [],
  template: false,
  stamps: { title: 1 },
  bodyConflict: null,
  updatedAt: 1,
  deletedAt: null,
  ...patch,
})

function put(store: string, record: { id: string }) {
  rows.set(`${store}/${record.id}`, record)
}

beforeEach(() => {
  installMemoryRuntime()
  put(COLUMNS, column("col-a", "board-a"))
  put(COLUMNS, column("col-b", "board-b"))
})

describe("referenceable", () => {
  it("offers a numbered card by its number", async () => {
    put(CARDS, card("card-1", "col-a", { title: "Fix sync", number: 12 }))

    expect(await referenceable("board-a")).toEqual([
      { id: "card-1", title: "Fix sync", hint: "#12", target: "12" },
    ])
  })

  it("offers an unnumbered card by its title", async () => {
    put(CARDS, card("card-1", "col-a", { title: "  Fix sync  " }))

    expect(await referenceable("board-a")).toEqual([
      { id: "card-1", title: "Fix sync", hint: "", target: "Fix sync" },
    ])
  })

  it("leaves out unnumbered cards whose title can't sit inside [[…]]", async () => {
    put(CARDS, card("card-1", "col-a", { title: "" }))
    put(CARDS, card("card-2", "col-a", { title: "a [b]" }))
    put(CARDS, card("card-3", "col-a", { title: "a | b" }))

    expect(await referenceable("board-a")).toEqual([])
  })
})

describe("resolveCardRef", () => {
  it("resolves a number to the card carrying it on this board", async () => {
    put(CARDS, card("card-1", "col-a", { title: "Fix sync", number: 12 }))

    const ref = await resolveCardRef("board-a", "12")
    expect(ref?.card.id).toBe("card-1")
    expect(ref?.columnTitle).toBe("col-a title")
  })

  it("still resolves a prefixed reference", async () => {
    put(CARDS, card("card-1", "col-a", { number: 12 }))

    expect((await resolveCardRef("board-a", "ROAD-12"))?.card.id).toBe("card-1")
  })

  it("resolves a title, ignoring case and surrounding space", async () => {
    put(CARDS, card("card-1", "col-a", { title: "Fix sync" }))

    expect((await resolveCardRef("board-a", " fix SYNC "))?.card.id).toBe(
      "card-1"
    )
  })

  it("still resolves a title once the card has a number", async () => {
    put(CARDS, card("card-1", "col-a", { title: "Fix sync", number: 3 }))

    expect((await resolveCardRef("board-a", "Fix sync"))?.card.id).toBe(
      "card-1"
    )
  })

  it("prefers the card numbered 2024 over one titled 2024", async () => {
    put(CARDS, card("titled", "col-a", { title: "2024" }))
    put(CARDS, card("numbered", "col-a", { title: "Other", number: 2024 }))

    expect((await resolveCardRef("board-a", "2024"))?.card.id).toBe("numbered")
  })

  it("falls back to the title when no card carries the number", async () => {
    put(CARDS, card("titled", "col-a", { title: "2024" }))

    expect((await resolveCardRef("board-a", "2024"))?.card.id).toBe("titled")
  })

  it("ignores cards on other boards and deleted cards", async () => {
    put(CARDS, card("elsewhere", "col-b", { title: "Fix sync", number: 12 }))
    put(CARDS, card("gone", "col-a", { title: "Gone", deletedAt: 5 }))

    expect(await resolveCardRef("board-a", "12")).toBeNull()
    expect(await resolveCardRef("board-a", "Fix sync")).toBeNull()
    expect(await resolveCardRef("board-a", "Gone")).toBeNull()
  })

  it("is null when nothing matches", async () => {
    expect(await resolveCardRef("board-a", "NOPE-999")).toBeNull()
  })
})

describe("findCardByRef", () => {
  const cards = [
    card("titled", "col-a", { title: "2024" }),
    card("numbered", "col-a", { title: "Fix sync", number: 2024 }),
    card("local", "col-a", { title: "Local card" }),
  ]

  it("finds a number, prefixed or not", () => {
    expect(findCardByRef(cards, "2024")?.id).toBe("numbered")
    expect(findCardByRef(cards, "ROAD-2024")?.id).toBe("numbered")
  })

  it("finds a title, ignoring case and surrounding space", () => {
    expect(findCardByRef(cards, " local CARD ")?.id).toBe("local")
    expect(findCardByRef(cards, "Fix sync")?.id).toBe("numbered")
  })

  it("is undefined when nothing matches", () => {
    expect(findCardByRef(cards, "NOPE-999")).toBeUndefined()
  })
})

describe("toWikilink", () => {
  it("drops a label that repeats the target", () => {
    expect(toWikilink("Fix sync", "Fix sync")).toBe("[[Fix sync]]")
    expect(toWikilink("12", "Fix sync")).toBe("[[12|Fix sync]]")
  })
})
