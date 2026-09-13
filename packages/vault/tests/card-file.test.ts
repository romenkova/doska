import { describe, expect, it } from "vitest"
import { CardFile } from "../src/card-file"
import { makeCard } from "./fakes"

describe("CardFile", () => {
  it("writes a card as frontmatter plus body", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "one\ntwo",
      deadline: "2026-09-01",
      priority: "high",
    })

    expect(CardFile.fromCard(card).text).toBe(
      `---\nid: ${card.id}\ntitle: Ship it\ndeadline: 2026-09-01\npriority: high\n---\none\ntwo\n`
    )
  })

  it("round trips", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "body",
      deadline: "2026-09-01",
      priority: "low",
    })
    const parsed = CardFile.parse(CardFile.fromCard(card).text)

    expect(parsed.id).toBe(card.id)
    expect(parsed.title).toBe("Ship it")
    expect(parsed.body).toBe("body")
    expect(parsed.deadline).toBe("2026-09-01")
    expect(parsed.priority).toBe("low")
    expect(parsed.patchFor(card)).toBeNull()
  })

  it("reads a file with no frontmatter as all body", () => {
    const parsed = CardFile.parse("just a note\n")
    expect(parsed.id).toBe("")
    expect(parsed.body).toBe("just a note")
  })

  it("reads broken frontmatter as all body rather than throwing", () => {
    const parsed = CardFile.parse("---\nid: [unclosed\n---\nbody\n")
    expect(parsed.id).toBe("")
    expect(parsed.body).toContain("body")
  })

  it("patches only the fields the file changed", () => {
    const card = makeCard({ columnId: "col-1", title: "Old", body: "same" })
    const edited = CardFile.parse(
      CardFile.fromCard(card).text.replace("title: Old", "title: New")
    )

    expect(edited.patchFor(card)).toEqual({ title: "New" })
  })

  it("clears a deadline the file dropped", () => {
    const card = makeCard({ columnId: "col-1", deadline: "2026-09-01" })
    const edited = CardFile.parse(
      CardFile.fromCard(card).text.replace("deadline: 2026-09-01\n", "")
    )

    expect(edited.patchFor(card)).toEqual({ deadline: null })
  })

  it("ignores a trailing newline an editor added", () => {
    const card = makeCard({ columnId: "col-1", body: "text" })
    const saved = CardFile.parse(`${CardFile.fromCard(card).text}\n\n`)

    expect(saved.patchFor(card)).toBeNull()
  })

  it("carries the number the board owns", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      number: 12,
      attachments: [
        {
          id: "a1",
          name: "plan.pdf",
          key: "att/00000000-0000-0000-0000-000000000000.pdf",
          mime: "application/pdf",
          size: 10,
        },
      ],
    })
    const text = CardFile.fromCard(card).text
    const parsed = CardFile.parse(text)

    expect(text).toContain("number: 12\n")
    expect(parsed.number).toBe(12)
    expect(parsed.patchFor(card)).toBeNull()

    // Name and path, not the board's struct, and never read back.
    expect(text).toContain("name: plan.pdf")
    expect(text).toContain(
      "file: ../_files/00000000-0000-0000-0000-000000000000.pdf"
    )
    expect(text).not.toContain("mime:")
    expect(parsed.attachments).toEqual([])
  })

  it("leaves an attachment out of the frontmatter when the body shows it", () => {
    const key = "att/00000000-0000-0000-0000-000000000000.png"
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: `![a shot](attachment:${key})`,
      attachments: [
        { id: "a1", name: "shot.png", key, mime: "image/png", size: 3 },
      ],
    })
    const text = CardFile.fromCard(card).text

    expect(text).not.toContain("attachments:")
    expect(text).toContain(
      "![a shot](../_files/00000000-0000-0000-0000-000000000000.png)"
    )
  })

  it("points image refs at the mirrored file, and back again", () => {
    const key = "att/00000000-0000-0000-0000-000000000000.png"
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: `before\n\n![a shot](attachment:${key})\n\nafter`,
    })
    const text = CardFile.fromCard(card).text

    expect(text).toContain(
      "![a shot](../_files/00000000-0000-0000-0000-000000000000.png)"
    )
    expect(text).not.toContain("attachment:")
    // Symmetric, or the rewrite reads back as an edit on the next pass.
    expect(CardFile.parse(text).patchFor(card)).toBeNull()
  })

  it("leaves ordinary image links alone", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "![logo](https://example.com/a.png)\n\n![local](./notes/b.png)",
    })
    const text = CardFile.fromCard(card).text

    expect(text).toContain("![logo](https://example.com/a.png)")
    expect(text).toContain("![local](./notes/b.png)")
    expect(CardFile.parse(text).patchFor(card)).toBeNull()
  })

  it("leaves sync state out of the file", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "mine",
      stamps: { body: 5, title: 3 },
      bodyConflict: { body: "theirs", at: 4 },
    })
    const text = CardFile.fromCard(card).text

    expect(text).not.toContain("stamps")
    expect(text).not.toContain("bodyConflict")
    expect(text).not.toContain("theirs")
    expect(CardFile.parse(text).patchFor(card)).toBeNull()
  })

  it("drops sync state a copied file carries in its frontmatter", () => {
    const card = makeCard({ columnId: "col-1", title: "Ship it" })
    const parsed = CardFile.parse(
      `---\nid: ${card.id}\ntitle: Ship it\nstamps:\n  body: 5\nbodyConflict:\n  body: theirs\n  at: 4\nsyncedBody: old\ntags: [ops]\n---\n`
    )

    expect(parsed.extra).toEqual({ tags: ["ops"] })
    expect(CardFile.fromCard(card, parsed.extra).text).not.toContain("stamps")
  })

  it("keeps frontmatter keys the user added", () => {
    const card = makeCard({ columnId: "col-1", title: "Ship it" })
    const parsed = CardFile.parse(
      `---\nid: ${card.id}\ntitle: Ship it\ntags: [ops]\n---\n`
    )

    expect(parsed.extra).toEqual({ tags: ["ops"] })
    expect(CardFile.fromCard(card, parsed.extra).text).toContain("tags:")
  })
})
