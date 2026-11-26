import { describe, expect, it, vi } from "vitest"
import { withDefaults } from "../src/api/db/record-defaults"
import { CARDS, META_STORE } from "../src/api/constants"
import { errorLog } from "../src/report-error"

const legacyCard = {
  id: "card-1",
  title: "Old",
  body: "",
  position: "a0",
  columnId: "col-1",
  updatedAt: 1,
  deletedAt: null,
}

describe("withDefaults", () => {
  it("fills fields a record is missing", () => {
    expect(withDefaults(CARDS, legacyCard)).toMatchObject({
      tags: [],
      users: [],
    })
  })

  it("keeps a record that doesn't fit its schema as is and logs it", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const odd = { ...legacyCard, tags: "idea" }
    expect(withDefaults(CARDS, odd)).toBe(odd)
    expect(errorLog().at(-1)?.message).toContain("tags")
  })

  it("leaves other stores alone", () => {
    expect(withDefaults(META_STORE, 42)).toBe(42)
  })
})
