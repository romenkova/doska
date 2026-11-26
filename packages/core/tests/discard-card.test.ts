import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS, HISTORY } from "../src/api/constants"
import {
  discardCard,
  discardIfBlank,
  holdForUpload,
  isBlankCard,
} from "../src/api/operations/discard-card"
import { fallbackCard } from "../src/seed"
import type { Card } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const blank = (id: string, number: number | null = null): Card => ({
  ...fallbackCard,
  id,
  columnId: "col",
  title: "",
  number,
})

const historyEntry = (id: string, entityId: string) => ({
  id,
  entityId,
  createdAt: 1,
  data: { title: "" },
})

const stored = (id: string) => rows.get(`${CARDS}/${id}`) as Card | undefined

beforeEach(() => {
  installMemoryRuntime()
  rows.set(`${COLUMNS}/col`, {
    id: "col",
    dashboardId: "board",
    position: "a0",
    updatedAt: 1,
    deletedAt: null,
  })
})

describe("isBlankCard", () => {
  it("is blank with only whitespace in title and body", () => {
    expect(isBlankCard({ title: " ", body: "\n", attachments: [] })).toBe(true)
  })

  it("isn't blank with a title, a body or an attachment", () => {
    const attachment = { id: "a", name: "a.png", key: "k", mime: "", size: 1 }
    expect(isBlankCard({ title: "x", body: "", attachments: [] })).toBe(false)
    expect(isBlankCard({ title: "", body: "x", attachments: [] })).toBe(false)
    expect(
      isBlankCard({ title: "", body: "", attachments: [attachment] })
    ).toBe(false)
  })
})

describe("discardCard", () => {
  it("removes a card the server never saw, history and all", async () => {
    rows.set(`${CARDS}/new`, blank("new"))
    rows.set(`${HISTORY}/h1`, historyEntry("h1", "new"))
    rows.set(`${HISTORY}/other`, historyEntry("other", "kept"))

    await discardCard("board", "new")

    expect(stored("new")).toBeUndefined()
    expect(rows.has(`${HISTORY}/h1`)).toBe(false)
    expect(rows.has(`${HISTORY}/other`)).toBe(true)
  })

  it("tombstones a card the server has numbered", async () => {
    rows.set(`${CARDS}/synced`, blank("synced", 7))

    await discardCard("board", "synced")

    expect(stored("synced")?.deletedAt).not.toBeNull()
  })
})

describe("discardIfBlank", () => {
  it("discards a blank card", async () => {
    rows.set(`${CARDS}/new`, blank("new"))

    await discardIfBlank("board", "new")

    expect(stored("new")).toBeUndefined()
  })

  it("keeps a card with content", async () => {
    rows.set(`${CARDS}/filled`, { ...blank("filled"), body: "notes" })

    await discardIfBlank("board", "filled")

    expect(stored("filled")?.deletedAt).toBeNull()
  })

  it("keeps a blank card while its upload is in flight", async () => {
    rows.set(`${CARDS}/new`, blank("new"))
    const release = holdForUpload("new")

    await discardIfBlank("board", "new")
    expect(stored("new")).toBeDefined()

    release()
    await discardIfBlank("board", "new")
    expect(stored("new")).toBeUndefined()
  })

  it("holds until every upload on the card is released", async () => {
    rows.set(`${CARDS}/new`, blank("new"))
    const first = holdForUpload("new")
    const second = holdForUpload("new")

    first()
    await discardIfBlank("board", "new")
    expect(stored("new")).toBeDefined()

    second()
    await discardIfBlank("board", "new")
    expect(stored("new")).toBeUndefined()
  })

  it("leaves an already deleted card alone", async () => {
    rows.set(`${CARDS}/gone`, { ...blank("gone"), deletedAt: 5 })

    await discardIfBlank("board", "gone")

    expect(stored("gone")?.deletedAt).toBe(5)
  })
})
