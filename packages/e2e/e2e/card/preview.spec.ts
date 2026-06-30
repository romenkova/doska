import { test, expect } from "@playwright/test"
import { addCard, card, createBoard, retitleCard } from "../helpers"

/**
 * A card always opens read-only: its notes render instead of showing the raw
 * markdown field. Double-clicking the content (or the Edit toggle) switches to
 * the editor. These drive the modal's preview controls the way a user does.
 */
test.describe("card preview & edit", () => {
  test("a card opens in read-only preview", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Final notes")

    // Reopen with a plain click: it comes up in preview — the editable Notes
    // field is gone and the Edit toggle is offered instead.
    await card(page, "Final notes").click()
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)
  })

  test("double-clicking the preview enters the editor", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Edit me")

    await card(page, "Edit me").click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    await page.getByRole("dialog").dblclick()
    await expect(page.getByPlaceholder("Title")).toBeFocused()
    await expect(page.getByPlaceholder("Notes")).toBeVisible()
  })

  test("preview can be toggled to edit and back", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Toggle me")

    // Opens in preview; "Edit" returns to the field, "Preview" renders it again.
    await card(page, "Toggle me").click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByPlaceholder("Notes").fill("Some content")

    await page.getByRole("button", { name: "Preview" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    await page.getByRole("button", { name: "Edit" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveValue("Some content")
  })
})
