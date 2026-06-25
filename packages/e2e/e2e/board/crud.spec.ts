import { test, expect } from "@playwright/test"
import { addCard, boardTitle, createBoard, deleteBoard } from "../helpers"

test.describe("board lifecycle", () => {
  test("a created board persists across a reload", async ({ page }) => {
    await createBoard(page)
    await expect(boardTitle(page, "Untitled board")).toBeVisible()

    await page.reload()
    await expect(boardTitle(page, "Untitled board")).toBeVisible()
  })

  test("renaming a board persists across a reload", async ({ page }) => {
    // Create the board under test rather than relying on a seeded fixture.
    await createBoard(page)
    await expect(boardTitle(page, "Untitled board")).toBeVisible()

    // Click the title to edit, type a new name, commit with Enter.
    await boardTitle(page, "Untitled board").click()
    const input = page.getByRole("textbox", { name: "Board name" })
    await input.fill("Renamed Roadmap")
    await input.press("Enter")

    await expect(boardTitle(page, "Renamed Roadmap")).toBeVisible()

    await page.reload()
    await expect(boardTitle(page, "Renamed Roadmap")).toBeVisible()
  })

  test("deleting a board removes it and its link goes dead", async ({
    page,
  }) => {
    // Name the board so its sidebar entry is unambiguous, and give it a card so
    // there's real content riding along with the board.
    const deckId = await createBoard(page)
    await boardTitle(page, "Untitled board").click()
    const input = page.getByRole("textbox", { name: "Board name" })
    await input.fill("Doomed board")
    await input.press("Enter")
    await expect(
      page.getByRole("button", { name: "Doomed board" })
    ).toBeVisible()
    await addCard(page, "To Do")

    // Delete it (confirming the "are you sure?" dialog).
    await deleteBoard(page)

    // Bounced back to Home, and it's gone from the sidebar.
    await expect(page.getByText("Pick a board to get started")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Doomed board" })
    ).toHaveCount(0)

    // The board (and everything on it) is really gone: its link no longer
    // resolves and redirects to Home.
    await page.goto(`/d/${deckId}`)
    await page.waitForURL(/\/$/)
    await expect(page.getByText("Pick a board to get started")).toBeVisible()
  })
})
