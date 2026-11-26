import { test, expect } from "@playwright/test"
import {
  boardTitle,
  createBoard,
  deleteBoard,
  openBoardInSidebar,
  renameBoard,
} from "../helpers"

/**
 * The landing screen with no board open. A first run is seeded with the Demo board
 * board, so the "no boards yet" copy is only reachable once every board is
 * deleted — both states are covered here.
 */
test.describe("home", () => {
  test("points at the sidebar while boards exist", async ({ page }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Roadmap")

    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Pick a board to get started" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "No boards yet" })
    ).toHaveCount(0)

    // The board is still reachable from the sidebar it points at. `exact` so
    // this is the sidebar entry, not Home's "Continue editing Roadmap".
    await page.getByRole("button", { name: "Roadmap", exact: true }).click()
    await expect(boardTitle(page, "Roadmap")).toBeVisible()
  })

  test("Create a board opens a fresh, empty board", async ({
    page,
  }) => {
    await page.goto("/")

    await page.getByRole("button", { name: "Create a board" }).click()

    await page.waitForURL(/\/d\/board-/)
    await page.getByRole("button", { name: "Empty", exact: true }).click()
    await expect(page.getByRole("button", { name: "Add column" })).toBeVisible()
    await expect(boardTitle(page, "Untitled board")).toBeVisible()
  })

  test("with the last board deleted it offers to create the first one", async ({
    page,
  }) => {
    await page.goto("/")
    // The seeded demo board is the only one, so deleting it empties the app.
    await openBoardInSidebar(page, "Demo board")
    await deleteBoard(page)

    await expect(
      page.getByRole("heading", { name: "No boards yet" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create a board" })
    ).toBeVisible()
  })
})
