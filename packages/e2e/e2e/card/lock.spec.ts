import { test, expect } from "@playwright/test"
import { addCard, createBoard, openCard, retitleCard } from "../helpers"

/**
 * Locking a card is the user's "this is final" switch: a locked card reopens in
 * read-only preview rather than the editor, so its notes render instead of
 * showing the raw markdown field. These drive the modal's lock/preview controls
 * the way a user clicks them.
 */
test.describe("card lock & preview", () => {
  test("a locked card reopens in read-only preview", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Final notes")

    // Add a body, then lock the card and let the close persist both.
    await openCard(page, "Final notes")
    await page.getByPlaceholder("Notes").fill("Decision: ship it")
    await page.getByRole("button", { name: "Lock" }).click()
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByPlaceholder("Title")).toBeHidden()

    // Reopen: it comes up locked and in preview — the editable Notes field is
    // gone and the note renders read-only instead.
    await page.getByText("Final notes").click()
    await expect(page.getByRole("button", { name: "Locked" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Back to edit" })).toBeVisible()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)
    await expect(
      page.getByRole("dialog").getByText("Decision: ship it")
    ).toBeVisible()
  })

  test("preview can be toggled back to edit without unlocking", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Toggle me")

    await openCard(page, "Toggle me")
    // Preview shows the rendered note; "Back to edit" returns to the field.
    await page.getByPlaceholder("Notes").fill("Some content")
    await page.getByRole("button", { name: "Preview" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveCount(0)

    await page.getByRole("button", { name: "Back to edit" }).click()
    await expect(page.getByPlaceholder("Notes")).toHaveValue("Some content")
  })
})
