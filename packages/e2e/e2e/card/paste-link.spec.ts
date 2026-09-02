import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  createBoard,
  pasteInto,
  textDataTransfer,
} from "../helpers"

/**
 * Pasting a URL over selected text turns the selection into a Markdown link.
 * The paste is dispatched by hand (see `pasteInto`): the OS clipboard is out of
 * reach without extra permissions, and a synthetic event hits the same handler.
 */
async function openNotesWith(page: Page, text: string) {
  await createBoard(page)
  await addCard(page, "To Do")
  await card(page, "Untitled card").click()
  const notes = page.getByPlaceholder("Notes")
  await notes.fill(text)
  return notes
}

// Runs in the page; Node has no DOM lib, so only the members used are typed.
interface Textarea {
  selectionStart: number
  selectionEnd: number
  setSelectionRange(start: number, end: number): void
}

test.describe("paste link", () => {
  test("a URL pasted over a selection wraps it in a link", async ({ page }) => {
    const notes = await openNotesWith(page, "see the docs today")

    await notes.evaluate((el: Textarea) => el.setSelectionRange(4, 12))
    await pasteInto(
      notes,
      await textDataTransfer(page, "https://example.com/docs")
    )

    await expect(notes).toHaveValue(
      "see [the docs](https://example.com/docs) today"
    )
    // Caret lands right after the link.
    const caret = await notes.evaluate((el: Textarea) => [
      el.selectionStart,
      el.selectionEnd,
    ])
    expect(caret).toEqual([40, 40])
  })

  test("non-URL text over a selection is left to the normal paste", async ({
    page,
  }) => {
    const notes = await openNotesWith(page, "see the docs today")

    await notes.evaluate((el: Textarea) => el.setSelectionRange(4, 12))
    await pasteInto(notes, await textDataTransfer(page, "plain words"))

    // A synthetic paste has no default action, so an untouched value means the
    // handler didn't claim it.
    await expect(notes).toHaveValue("see the docs today")
  })
})
