import { describe, expect, it } from "vitest"
import type { Card, Column } from "../src/types"
import { touchCard, touchColumn } from "../src/api/sync/touch"

const card: Card = {
  id: "c1",
  title: "t",
  body: "b",
  position: "a0",
  columnId: "col",
  number: null,
  deadline: null,
  priority: "",
  attachments: [],
  updatedAt: 10,
  deletedAt: null,
  stamps: {},
  bodyConflict: null,
}

const column: Column = {
  id: "col",
  title: "t",
  position: "a0",
  dashboardId: "b",
  collapsed: false,
  color: "",
  done: false,
  updatedAt: 10,
  deletedAt: null,
  stamps: { title: 8 },
}

describe("touchCard", () => {
  it("stamps the touched groups and moves updatedAt up with them", () => {
    const touched = touchCard(card, ["body", "place"], 20)

    expect(touched.stamps.body).toBe(20)
    expect(touched.stamps.place).toBe(20)
    expect(touched.updatedAt).toBe(20)
  })

  // A missing stamp reads as `updatedAt`, so an untouched group left missing
  // would read as the new stamp and win merges it took no part in.
  it("pins the untouched groups at the old updatedAt", () => {
    const touched = touchCard(card, ["body"], 20)

    expect(touched.stamps).toEqual({
      title: 10,
      body: 20,
      place: 10,
      deadline: 10,
      priority: 10,
      attachments: 10,
      deleted: 10,
      conflict: 10,
    })
  })

  it("stamps a record stored before stamps existed", () => {
    const legacy = { ...card, stamps: undefined as unknown as Card["stamps"] }
    const touched = touchCard(legacy, ["place"], 20)

    expect(touched.stamps.place).toBe(20)
    expect(touched.stamps.title).toBe(10)
  })

  it("leaves the record it was given alone", () => {
    touchCard(card, ["body"], 20)

    expect(card.stamps).toEqual({})
    expect(card.updatedAt).toBe(10)
  })
})

describe("touchColumn", () => {
  it("keeps a group's own stamp over the record's updatedAt", () => {
    const touched = touchColumn(column, ["color"], 20)

    expect(touched.stamps.title).toBe(8)
    expect(touched.stamps.color).toBe(20)
    expect(touched.stamps.position).toBe(10)
    expect(touched.updatedAt).toBe(20)
  })
})
