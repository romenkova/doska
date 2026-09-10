import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  card,
  copyText,
  createBoard,
  fieldText,
  panelField,
} from "../helpers"

/** Pasting a URL over selected text turns the selection into a Markdown link. */
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
    await copyText(page, "https://example.com/docs")

    await selectTheDocs(notes)
    await notes.press("ControlOrMeta+v")

    await expect
      .poll(() => fieldText(notes))
      .toBe("see [the docs](https://example.com/docs) today")
  })

  test("non-URL text over a selection is pasted as it is", async ({ page }) => {
    const notes = await openNotesWith(page, "see the docs today")
    await copyText(page, "plain words")

    await selectTheDocs(notes)
    await notes.press("ControlOrMeta+v")

    await expect.poll(() => fieldText(notes)).toBe("see plain words today")
  })
})
