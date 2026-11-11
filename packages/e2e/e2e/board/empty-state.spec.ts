import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  boardTitle,
  card,
  column,
  createBoard,
  menu,
  openBoardMenu,
  renameBoard,
  retitleCard,
} from "../helpers"

/** Creates a board and leaves it on its empty state, unlike `createBoard`. */
async function createEmptyBoard(page: Page): Promise<void> {
  await page.goto("/")
  await page.getByRole("button", { name: "Create a board" }).click()
  await page.waitForURL(/\/d\/board-/)
  await expect(
    page.getByText("This board is empty. How do you want to start?")
  ).toBeVisible()
}

test.describe("board empty state", () => {
  test("Empty gives the default columns", async ({ page }) => {
    await createEmptyBoard(page)

    await page.getByRole("button", { name: "Empty", exact: true }).click()

    await expect(page.getByRole("group", { name: "To Do" })).toBeVisible()
    await expect(page.getByRole("group", { name: "In Progress" })).toBeVisible()
    await expect(page.getByRole("group", { name: "Done" })).toBeVisible()
  })

  test("From template is off until there is a board template", async ({
    page,
  }) => {
    await createEmptyBoard(page)

    await expect(
      page.getByRole("button", { name: "From template" })
    ).toBeDisabled()
  })

  test("From template copies the template's columns and cards", async ({
    page,
  }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Sprint")
    await addCard(page, "Done")
    await retitleCard(page, "Untitled card", "Demo prep")
    await openBoardMenu(page)
    await menu(page, "Board actions")
      .getByRole("menuitem", { name: "Add to templates" })
      .click()

    await createEmptyBoard(page)
    await page.getByRole("button", { name: "From template" }).click()
    await page.getByRole("menuitem", { name: "Sprint" }).click()

    await expect(
      column(page, "Done").locator(card(page, "Demo prep"))
    ).toBeVisible()
    await expect(boardTitle(page, "Untitled board")).toBeVisible()
  })
})
