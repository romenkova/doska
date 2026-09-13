import { describe, expect, it } from "vitest"
import { mergeBody } from "../src/merge-body"

const base =
  "# Title\n\n- [ ] task one\n- [ ] task two\n\nSome paragraph here.\n\nLast line."

describe("mergeBody", () => {
  it("theirs unchanged returns ours", () => {
    expect(mergeBody(base, base + "\nmore", base)).toEqual({
      body: base + "\nmore",
      conflict: false,
    })
  })

  it("ours unchanged returns theirs", () => {
    expect(mergeBody(base, base, base + "\nmore")).toEqual({
      body: base + "\nmore",
      conflict: false,
    })
  })

  it("different paragraphs merge", () => {
    const ours = base.replace("# Title", "# New title")
    const theirs = base.replace("Last line.", "Last line changed.")
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: base
        .replace("# Title", "# New title")
        .replace("Last line.", "Last line changed."),
      conflict: false,
    })
  })

  it("checkbox tick plus paragraph edit elsewhere merge", () => {
    const ours = base.replace("[ ] task one", "[x] task one")
    const theirs = base.replace(
      "Some paragraph here.",
      "Some paragraph, edited."
    )
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: base
        .replace("[ ] task one", "[x] task one")
        .replace("Some paragraph here.", "Some paragraph, edited."),
      conflict: false,
    })
  })

  it("same line edited both sides reports conflict and returns ours", () => {
    const ours = base.replace("Some paragraph here.", "ours")
    const theirs = base.replace("Some paragraph here.", "theirs")
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: ours,
      conflict: true,
    })
  })

  it("append at end plus edit at top merge", () => {
    const ours = base.replace("# Title", "# T")
    const theirs = base + "\n\nAppended."
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: ours + "\n\nAppended.",
      conflict: false,
    })
  })

  it("both append the same text", () => {
    expect(mergeBody(base, base + "\nx", base + "\nx")).toEqual({
      body: base + "\nx",
      conflict: false,
    })
  })

  it("both append different text conflicts", () => {
    expect(mergeBody(base, base + "\nx", base + "\ny")).toEqual({
      body: base + "\nx",
      conflict: true,
    })
  })

  it("adjacent lines edited merge", () => {
    const ours = base.replace("[ ] task one", "[x] task one")
    const theirs = base.replace("[ ] task two", "[x] task two")
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: base
        .replace("[ ] task one", "[x] task one")
        .replace("[ ] task two", "[x] task two"),
      conflict: false,
    })
  })

  it("ours deletes a block theirs edited inside conflicts", () => {
    const ours = base.replace("- [ ] task one\n- [ ] task two\n\n", "")
    const theirs = base.replace("task two", "task 2")
    expect(mergeBody(base, ours, theirs)).toEqual({
      body: ours,
      conflict: true,
    })
  })

  it("trailing newline kept", () => {
    expect(mergeBody("a\nb\n", "a\nb\nc\n", "A\nb\n")).toEqual({
      body: "A\nb\nc\n",
      conflict: false,
    })
  })

  it("CRLF preserved", () => {
    expect(mergeBody("a\r\nb\r\nc", "A\r\nb\r\nc", "a\r\nb\r\nC")).toEqual({
      body: "A\r\nb\r\nC",
      conflict: false,
    })
  })

  it("empty base, both add", () => {
    expect(mergeBody("", "x", "y")).toEqual({ body: "x", conflict: true })
  })

  it("insert at the same spot, different text, conflicts", () => {
    expect(mergeBody("a\nb", "a\nx\nb", "a\ny\nb")).toEqual({
      body: "a\nx\nb",
      conflict: true,
    })
  })
})
