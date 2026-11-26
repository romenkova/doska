import { beforeEach, describe, expect, it, vi } from "vitest"
import { CARDS } from "../src/api/constants"
import { runtime } from "../src/runtime"
import { installMemoryRuntime, rows } from "./memory-runtime"

const legacyCard = {
  id: "card-1",
  title: "Old",
  body: "",
  position: "a0",
  columnId: "col-1",
  updatedAt: 1,
  deletedAt: null,
}

describe("record writes", () => {
  beforeEach(installMemoryRuntime)

  it("fills fields a record is missing", async () => {
    await runtime().db.set(CARDS, "card-1", legacyCard)
    expect(rows.get("cards/card-1")).toMatchObject({ tags: [], users: [] })
  })

  it("keeps a record that doesn't fit its schema as is", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const odd = { ...legacyCard, tags: "idea" }
    await runtime().db.set(CARDS, "card-1", odd)
    expect(rows.get("cards/card-1")).toEqual(odd)
  })
})
