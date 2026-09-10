import { test, expect } from "@playwright/test"
import { addCard, card, createBoard, fieldText, panelField } from "../helpers"

// Type with pressSequentially, not fill: the menu opens on typed input.
test.describe("slash menu", () => {
  test("inserts a to-do checkbox", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("/task")

    const item = page.getByRole("option", { name: /^To-do/ })
    await expect(item).toBeVisible()
    await item.click()

    await expect.poll(() => fieldText(notes)).toBe("- [ ] ")
  })

  test("filters commands by the typed query", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("/head")

    await expect(page.getByRole("option", { name: /^Heading 1/ })).toBeVisible()
    await expect(page.getByRole("option", { name: /^Heading 2/ })).toBeVisible()
    await expect(page.getByRole("option", { name: /^To-do/ })).toHaveCount(0)
  })

  test("Escape closes the menu but leaves the card panel open", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("/task")
    await expect(page.getByRole("option", { name: /^To-do/ })).toBeVisible()

    await notes.press("Escape")

    await expect(page.getByRole("option", { name: /^To-do/ })).toHaveCount(0)
    await expect(notes).toBeVisible()
  })
})
