import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  cardPanel,
  closeCard,
  columnCardTitles,
  createBoard,
  digestRow,
  openCard,
  retitleCard,
  setDeadline,
} from "../helpers"

/**
 * Moves the open card from the panel's "⋯" menu, which is the only column
 * control the panel has. Scoped to the panel: the board card behind it has a
 * menu of the same name.
 */
async function moveOpenCard(page: Page, columnName: string) {
  await cardPanel(page).getByRole("button", { name: "Card actions" }).click()
  await page.getByRole("menuitem", { name: "Move to", exact: true }).click()
  await page.getByRole("menuitem", { name: columnName }).click()
}

test.describe("moving a card from its panel", () => {
  test("moves it to the chosen column on the board", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Restage me")

    await openCard(page, "Restage me")
    await moveOpenCard(page, "In Progress")

    // The menu re-reads the card, so the column it now sits in is unpickable.
    await cardPanel(page).getByRole("button", { name: "Card actions" }).click()
    await page.getByRole("menuitem", { name: "Move to", exact: true }).click()
    await expect(
      page.getByRole("menuitem", { name: "In Progress" })
    ).toBeDisabled()
    await page.keyboard.press("Escape")
    await page.keyboard.press("Escape")

    await closeCard(page)
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

    await setDeadline(page, "Due and misfiled", "Today")

    await page.goto("/digest")
    await digestRow(page, "Due and misfiled").click()

    await moveOpenCard(page, "Done")

    // The digest row re-tags itself, so the move landed on the card itself.
    await expect(digestRow(page, "Due and misfiled")).toContainText("Done")
  })
})
