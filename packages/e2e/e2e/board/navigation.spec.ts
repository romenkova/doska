import { test, expect } from "@playwright/test"
import {
  addCard,
  boardTitle,
  createBoard,
  openBoardInSidebar,
  renameBoard,
  retitleCard,
} from "../helpers"

/**
 * With more than one board, the sidebar is how a user moves between them. These
 * drive that switching and prove each board keeps its own contents — addressing
 * boards and cards by the names a user reads, never by id.
 */
test.describe("board navigation", () => {
  test("switching boards in the sidebar shows each board's own cards", async ({
    page,
  }) => {
    // First board with its own card.
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Alpha")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Alpha card")

    // Second board with a different card; we're now viewing it.
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Beta")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Beta card")

    // Jump back to Alpha: its card is here, Beta's is not.
    await openBoardInSidebar(page, "Alpha")
    await expect(page.getByText("Alpha card")).toBeVisible()
    await expect(page.getByText("Beta card")).toHaveCount(0)

    // And over to Beta: the reverse.
    await openBoardInSidebar(page, "Beta")
    await expect(page.getByText("Beta card")).toBeVisible()
    await expect(page.getByText("Alpha card")).toHaveCount(0)
  })

  test("a board reload reopens the same board, not Home", async ({ page }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Sticky board")

    await page.reload()
    await expect(boardTitle(page, "Sticky board")).toBeVisible()
  })

  test("Home offers to continue editing the last opened board", async ({
    page,
  }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Resume me")

    // Land on Home, which should remember the board we just had open.
    await page.goto("/")
    await page
      .getByRole("button", { name: "Continue editing Resume me" })
      .click()

    await expect(boardTitle(page, "Resume me")).toBeVisible()
  })
})
