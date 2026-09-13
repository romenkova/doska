import { describe, expect, it } from "vitest"
import { rebaseDraft } from "./draft"

const base = "one\n\ntwo\n\nthree"
const typed = "one!\n\ntwo\n\nthree"

describe("rebaseDraft", () => {
  it("is the same draft while the body holds still", () => {
    const draft = { base, body: typed }
    expect(rebaseDraft(draft, base)).toBe(draft)
  })

  it("follows a pull when nothing is typed", () => {
    const pulled = "one\n\ntwo\n\nthree!"
    expect(rebaseDraft({ base, title: "t" }, pulled)).toEqual({
      base: pulled,
      title: "t",
    })
  })

  it("moves the base when its own save lands", () => {
    expect(rebaseDraft({ base, body: typed }, typed)).toEqual({
      base: typed,
      body: typed,
    })
  })

  it("carries typing onto a body a pull rewrote", () => {
    const pulled = "one\n\ntwo\n\nthree!"
    expect(rebaseDraft({ base, body: typed }, pulled)).toEqual({
      base: pulled,
      body: "one!\n\ntwo\n\nthree!",
    })
  })

  it("keeps the typed line when the pull changed the same one", () => {
    const pulled = "one?\n\ntwo\n\nthree"
    expect(rebaseDraft({ base, body: typed }, pulled)).toEqual({
      base: pulled,
      body: typed,
    })
  })
})
