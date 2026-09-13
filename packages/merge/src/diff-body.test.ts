import { describe, expect, it } from "vitest"
import { diffBody } from "./diff-body"

describe("diffBody", () => {
  it("marks nothing when equal", () => {
    expect(diffBody("a\nb", "a\nb")).toEqual([
      { kind: "same", text: "a" },
      { kind: "same", text: "b" },
    ])
  })

  it("shows a replaced line as removed then added", () => {
    expect(diffBody("a\nb\nc", "a\nB\nc")).toEqual([
      { kind: "same", text: "a" },
      { kind: "removed", text: "b" },
      { kind: "added", text: "B" },
      { kind: "same", text: "c" },
    ])
  })

  it("keeps blank lines", () => {
    expect(diffBody("a\n\nb", "a\n\nb\n\nc")).toEqual([
      { kind: "same", text: "a" },
      { kind: "same", text: "" },
      { kind: "same", text: "b" },
      { kind: "added", text: "" },
      { kind: "added", text: "c" },
    ])
  })
})
