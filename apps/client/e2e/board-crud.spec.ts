import { test, expect } from "@playwright/test"
import { addCard, createBoard, idbGet, idbKeys } from "./helpers"

test.describe("board lifecycle", () => {
  test("a created board persists across a reload", async ({ page }) => {
    await createBoard(page)
    await expect(
      page.getByRole("heading", { name: "Untitled board" })
    ).toBeVisible()

    await page.reload()
    await expect(
      page.getByRole("heading", { name: "Untitled board" })
    ).toBeVisible()
  })

  test("renaming a board persists across a reload", async ({ page }) => {
    // Create the board under test rather than relying on a seeded fixture.
    await createBoard(page)
    await expect(
      page.getByRole("heading", { name: "Untitled board" })
    ).toBeVisible()

    // Click the title to edit, type a new name, commit with Enter.
    await page.getByRole("heading", { name: "Untitled board" }).click()
    const input = page.getByRole("textbox", { name: "Board name" })
    await input.fill("Renamed Roadmap")
    await input.press("Enter")

    await expect(
      page.getByRole("heading", { name: "Renamed Roadmap" })
    ).toBeVisible()

    await page.reload()
    await expect(
      page.getByRole("heading", { name: "Renamed Roadmap" })
    ).toBeVisible()
  })

  test("deleting a board removes it and cascades to its cards", async ({
    page,
  }) => {
    // Start on a fresh board so the cascade assertion is isolated.
    const deckId = await createBoard(page)

    // Add one card, then capture the card ids the board owns.
    await addCard(page, "To Do")

    const board = await idbGet<Record<string, string[]>>(
      page,
      "boards",
      deckId
    )
    const cardIds = Object.values(board).flat()
    expect(cardIds.length).toBeGreaterThan(0)

    // Delete the board.
    await page.getByRole("button", { name: "Delete board" }).click()

    // Redirected off the deleted board, and it's gone from the boards store.
    await expect.poll(() => idbKeys(page, "boards")).not.toContain(deckId)

    // Its cards were removed too (cascade).
    const remainingCards = await idbKeys(page, "cards")
    for (const id of cardIds) expect(remainingCards).not.toContain(id)
  })
})
