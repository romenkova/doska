import { describe, expect, it } from "vitest"
import type { DiffLine } from "@doska/merge"
import { diffHunks } from "./diff-hunks"

const same = (text: string): DiffLine => ({ kind: "same", text })
const added = (text: string): DiffLine => ({ kind: "added", text })

describe("diffHunks", () => {
  it("drops an unchanged body entirely", () => {
    expect(diffHunks([same("a"), same("b"), same("c")], 1)).toEqual([])
  })

  it("keeps context around a change and drops the ends", () => {
    const lines = [
      same("a"),
      same("b"),
      same("c"),
      added("d"),
      same("e"),
      same("f"),
      same("g"),
    ]
    expect(diffHunks(lines, 1)).toEqual([same("c"), added("d"), same("e")])
  })

  it("keeps a gap between two hunks", () => {
    const lines = [added("a"), same("b"), same("c"), same("d"), added("e")]
    expect(diffHunks(lines, 1)).toEqual([
      added("a"),
      same("b"),
      { kind: "gap" },
      same("d"),
      added("e"),
    ])
  })

  it("has no gap when every line is near a change", () => {
    const lines = [same("a"), added("b"), same("c")]
    expect(diffHunks(lines, 1)).toEqual(lines)
  })
})
