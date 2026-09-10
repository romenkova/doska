import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  closeCard,
  createBoard,
  fieldText,
  openCard,
  panelField,
} from "../helpers"

/**
 * Enter inside a list item carries the marker to the next row, and Enter on an
 * empty item drops out of the list. Everything here is typed into the Notes
 * field exactly as a user would; the assertions read the markdown the user sees
 * in that field.
 */
async function openNotes(page: Page) {
  await createBoard(page)
  await addCard(page, "To Do")
  await card(page, "Untitled card").click()
  const notes = panelField(page, "Notes")
  await notes.click()
  return notes
}

test.describe("list continuation", () => {
  test("Enter continues a bullet list", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("- milk")
    await notes.press("Enter")
    await notes.pressSequentially("eggs")

    await expect.poll(() => fieldText(notes)).toBe("- milk\n- eggs")
  })

  test("Enter renumbers an ordered list", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("1. first")
    await notes.press("Enter")
    await notes.pressSequentially("second")

    await expect.poll(() => fieldText(notes)).toBe("1. first\n2. second")
  })

  test("a task item continues unchecked", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("- [x] shipped")
    await notes.press("Enter")
    await notes.pressSequentially("next up")

    await expect
      .poll(() => fieldText(notes))
      .toBe("- [x] shipped\n- [ ] next up")
  })

  test("Enter on an empty item leaves the list", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("- milk")
    await notes.press("Enter")
    // The continued row is empty. Enter there first loosens the list, putting
    // a blank line above the row; Enter again strips its marker — the way out
    // of a list.
    await notes.press("Enter")
    await expect.poll(() => fieldText(notes)).toBe("- milk\n\n- ")
    await notes.press("Enter")
    await expect.poll(() => fieldText(notes)).toBe("- milk\n\n")

    await notes.pressSequentially("plain prose")
    await expect.poll(() => fieldText(notes)).toBe("- milk\n\nplain prose")
  })

  test("Enter on a plain line is left alone", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("hello")
    await notes.press("Enter")
    await notes.pressSequentially("world")

    await expect.poll(() => fieldText(notes)).toBe("hello\nworld")
  })

  test("a continued list persists through save and reopen", async ({
    page,
  }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("- milk")
    await notes.press("Enter")
    await notes.pressSequentially("eggs")
    await closeCard(page)

    await openCard(page, "milk")
    await expect
      .poll(() => fieldText(panelField(page, "Notes")))
      .toBe("- milk\n- eggs")
  })
})
