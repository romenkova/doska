import { test, expect } from "@playwright/test"
import { addCard, card, createBoard } from "./helpers"

test.describe("card lifecycle", () => {
  test("create, edit, persist, then delete a card", async ({ page }) => {
    // Create the board under test rather than relying on a seeded fixture.
    await createBoard(page)

    // Create a card in To Do — it seeds with the fallback title.
    await addCard(page, "To Do")

    // Open it and give it a distinct title via the modal editor.
    await page.getByText("Untitled card").click()
    const title = page.getByPlaceholder("Title")
    await expect(title).toBeFocused()
    await title.fill("My E2E Card")
    await page.getByRole("button", { name: "Save" }).click()

    // It renders on the board with the new title...
    await expect(page.getByText("My E2E Card")).toBeVisible()
    // ...and survives a reload (IndexedDB round-trip).
    await page.reload()
    await expect(page.getByText("My E2E Card")).toBeVisible()

    // Delete it via the card's action menu.
    const target = card(page, "My E2E Card")
    await target.getByRole("button", { name: "Card actions" }).click()
    await page.getByRole("menuitem", { name: "Delete" }).click()

    await expect(page.getByText("My E2E Card")).toHaveCount(0)
    await page.reload()
    await expect(page.getByText("My E2E Card")).toHaveCount(0)
  })
})
