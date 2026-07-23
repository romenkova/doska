import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  retitleCard,
} from "../helpers"

/**
 * A card with a body opens read-only: its notes render instead of showing the
 * raw markdown field. Double-clicking the content (or the Edit toggle) switches
 * to the editor. An empty card has nothing to preview, so it opens straight in
 * the editor. These drive the panel's preview controls the way a user does.
 */
test.describe("card preview & edit", () => {
  test("an empty card opens in the editor", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    // No body yet — opens straight in the editor, not preview.
    await card(page, "Untitled card").click()
    await expect(page.getByPlaceholder("Title")).toBeFocused()
    await expect(page.getByPlaceholder("Notes")).toBeVisible()
  })

  test("a card with a body opens in read-only preview", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Final notes")
    await editCardBody(page, "Final notes", "Decision: ship it")

    // Reopen with a plain click: it comes up in preview — the editable Notes
    // field is gone and the note renders read-only instead.
    await card(page, "Final notes").click()
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)
    await expect(cardPanel(page).getByText("Decision: ship it")).toBeVisible()
  })

  test("double-clicking the preview enters the editor", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Edit me")
    await editCardBody(page, "Edit me", "Some content")

    await card(page, "Edit me").click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    // Double-clicking the rendered note drops into the editor with the caret
    // where you clicked — the Notes field, back and holding the same content.
    await cardPanel(page).getByText("Some content").dblclick()
    const notes = page.getByPlaceholder("Notes")
    await expect(notes).toBeFocused()
    await expect(notes).toHaveValue("Some content")
  })

  test("preview can be toggled to edit and back", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Toggle me")
    await editCardBody(page, "Toggle me", "Some content")

    // Opens in preview; "Edit" returns to the field, "Preview" renders it again.
    await card(page, "Toggle me").click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    await page.getByRole("button", { name: "Edit" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveValue("Some content")

    await page.getByRole("button", { name: "Preview" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)
  })
})
