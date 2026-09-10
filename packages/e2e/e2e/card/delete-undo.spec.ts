import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  fieldText,
  openCard,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * Deleting a card is undoable from the toast it raises, whether the delete came
 * from the board card's menu or from the open panel. The toast lasts five
 * seconds; after that the delete stands and the card is only in the trash.
 */

/** The undo toast for the card titled `title`, matched on its own wording. */
function undoToast(page: Page, title: string) {
  return page.getByText(`${title} deleted`)
}

async function deleteFromMenu(page: Page, title: string): Promise<void> {
  await card(page, title).getByRole("button", { name: "Card actions" }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
}

async function boardWithCard(page: Page, title: string): Promise<void> {
  await createBoard(page)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", title)
}

test.describe("deleting a card with undo", () => {
  test("the board card's menu deletes it and the toast puts it back", async ({
    page,
  }) => {
    await boardWithCard(page, "Throw me out")

    await deleteFromMenu(page, "Throw me out")
    await expect(card(page, "Throw me out")).toHaveCount(0)

    await expect(undoToast(page, "Throw me out")).toBeVisible()
    await page.getByRole("button", { name: "Undo" }).click()

    await expect(card(page, "Throw me out")).toBeVisible()
    // Restored from the board, so it stays on the board — no panel opens.
    await expect(panelField(page, "Title")).toHaveCount(0)
  })

  test("the restored card survives a reload", async ({ page }) => {
    await boardWithCard(page, "Keep me")

    await deleteFromMenu(page, "Keep me")
    await page.getByRole("button", { name: "Undo" }).click()
    await expect(card(page, "Keep me")).toBeVisible()

    await page.reload()
    await expect(card(page, "Keep me")).toBeVisible()
  })

  test("letting the toast go leaves the card deleted", async ({ page }) => {
    await boardWithCard(page, "Really gone")

    await deleteFromMenu(page, "Really gone")
    // The toast lives 5s; wait it out rather than racing its exit animation.
    await expect(undoToast(page, "Really gone")).toHaveCount(0, {
      timeout: 10_000,
    })

    await expect(card(page, "Really gone")).toHaveCount(0)
    await page.reload()
    await expect(card(page, "Really gone")).toHaveCount(0)
  })

  test("the panel's delete closes the panel, and undo reopens it", async ({
    page,
  }) => {
    await boardWithCard(page, "Panel delete")
    await openCard(page, "Panel delete")

    // Scoped to the panel: the board card behind it has a menu of the same name.
    await cardPanel(page).getByRole("button", { name: "Card actions" }).click()
    await page.getByRole("menuitem", { name: "Delete" }).click()

    // The open card is gone, so the panel cannot stay open on it.
    await page.waitForURL((url) => !url.pathname.includes("/c/"))
    await expect(panelField(page, "Title")).toHaveCount(0)
    await expect(card(page, "Panel delete")).toHaveCount(0)

    await expect(undoToast(page, "Panel delete")).toBeVisible()
    await page.getByRole("button", { name: "Undo" }).click()

    // Deleted from the panel, so undo hands the card back the way it was open.
    await expect(cardPanel(page)).toBeVisible()
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Panel delete")
    await expect(page).toHaveURL(/\/c\//)
    await expect(card(page, "Panel delete")).toBeVisible()
  })
})
