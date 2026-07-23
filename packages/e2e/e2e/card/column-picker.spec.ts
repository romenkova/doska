import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  columnCardTitles,
  createBoard,
  openCard,
  retitleCard,
} from "../helpers"

/** The panel's column control, named after the column the card is in. */
function columnPicker(page: Page, columnName: string) {
  return page.getByRole("button", { name: `Column: ${columnName}. Move card` })
}

test.describe("moving a card from its panel", () => {
  test("moves it to the chosen column on the board", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Restage me")

    await openCard(page, "Restage me")
    await columnPicker(page, "To Do").click()
    await page.getByRole("menuitem", { name: "In Progress" }).click()

    // The control renames itself to the column the card now sits in.
    await expect(columnPicker(page, "In Progress")).toBeVisible()

    await page.getByRole("button", { name: "Save" }).click()
    await expect(await columnCardTitles(page, "In Progress")).toEqual([
      "Restage me",
    ])
    await expect(await columnCardTitles(page, "To Do")).toEqual([])
  })

  test("a card opened from the digest can be moved without its board on screen", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Due and misfiled")

    await page.setViewportSize({ width: 500, height: 900 })
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    await page
      .locator("[data-rfd-draggable-id]", { hasText: "Due and misfiled" })
      .locator('input[type="date"]')
      .fill(iso)

    await page.goto("/digest")
    await page.getByRole("button", { name: /Due and misfiled/ }).click()

    await columnPicker(page, "To Do").click()
    await page.getByRole("menuitem", { name: "Done" }).click()
    await expect(columnPicker(page, "Done")).toBeVisible()

    // The digest row re-tags itself, so the move landed on the card itself.
    await expect(
      page.getByRole("button", { name: /Due and misfiled.*DONE/i })
    ).toBeVisible()
  })
})
