import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  card,
  createBoard,
  fieldText,
  panelField,
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
  const notes = panelField(page, "Notes")
  await notes.fill(text)
  return notes
}

/** Selects "the docs" in "see the docs today", from the keyboard. */
async function selectTheDocs(notes: Locator): Promise<void> {
  await notes.press("End")
  for (let i = 0; i < " today".length; i++) await notes.press("ArrowLeft")
  for (let i = 0; i < "the docs".length; i++)
    await notes.press("Shift+ArrowLeft")
}

test.describe("paste link", () => {
  test("a URL pasted over a selection wraps it in a link", async ({ page }) => {
    const notes = await openNotesWith(page, "see the docs today")

    await selectTheDocs(notes)
    await pasteInto(
      notes,
      await textDataTransfer(page, "https://example.com/docs")
    )

    await expect
      .poll(() => fieldText(notes))
      .toBe("see [the docs](https://example.com/docs) today")
  })

  test("non-URL text over a selection is pasted as it is", async ({ page }) => {
    const notes = await openNotesWith(page, "see the docs today")

    await selectTheDocs(notes)
    await pasteInto(notes, await textDataTransfer(page, "plain words"))

    await expect.poll(() => fieldText(notes)).toBe("see plain words today")
  })
})
