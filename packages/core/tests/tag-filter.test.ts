import { describe, expect, it } from "vitest"
import { tagColor } from "../src/utils/tag-color"
import { hasTag, removeFromTags, renameInTags } from "../src/utils/tag-filter"

describe("hasTag", () => {
  it("ignores case", () => {
    expect(hasTag(["Bug", "ui"], "BUG")).toBe(true)
    expect(hasTag(["Bug", "ui"], "ops")).toBe(false)
  })
})

describe("renameInTags", () => {
  it("renames in place, keeping order", () => {
    expect(renameInTags(["a", "Bug", "c"], "bug", "defect")).toEqual([
      "a",
      "defect",
      "c",
    ])
  })

  it("merges onto a tag already in the list", () => {
    expect(renameInTags(["bug", "Defect"], "bug", "defect")).toEqual([
      "defect",
    ])
  })

  it("can change only the case", () => {
    expect(renameInTags(["bug"], "bug", "Bug")).toEqual(["Bug"])
  })
})

describe("removeFromTags", () => {
  it("removes every case variant", () => {
    expect(removeFromTags(["Bug", "ui", "BUG"], "bug")).toEqual(["ui"])
  })
})

describe("tagColor", () => {
  it("looks up by lowercased name, empty when unset", () => {
    expect(tagColor({ bug: "rose" }, "BUG")).toBe("rose")
    expect(tagColor({ bug: "rose" }, "ops")).toBe("")
  })
})
