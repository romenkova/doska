import { test, expect } from "@playwright/test"
import {
  addCard,
  cardTitled,
  closeCard,
  createBoard,
  openCard,
  openNewCard,
  openTrash,
  panelField,
  trashEntry,
} from "../helpers"

test.describe("a new card closed blank", () => {
  test("isn't kept, and doesn't go to the trash", async ({ page }) => {
    await createBoard(page)

    await openNewCard(page, "To Do")
    await closeCard(page)

    await expect(cardTitled(page, "Untitled card")).toHaveCount(0)
    await page.reload()
    await expect(cardTitled(page, "Untitled card")).toHaveCount(0)
    await openTrash(page)
    await expect(trashEntry(page, "Untitled card")).toHaveCount(0)
  })

  test("isn't kept when closed with Escape", async ({ page }) => {
    await createBoard(page)

    await openNewCard(page, "To Do")
    await page.keyboard.press("Escape")
    await page.waitForURL((url) => !url.pathname.includes("/c/"))

    await expect(cardTitled(page, "Untitled card")).toHaveCount(0)
  })

  test("is kept once it has notes", async ({ page }) => {
    await createBoard(page)

    await openNewCard(page, "To Do")
    await panelField(page, "Notes").fill("Just notes")
    await closeCard(page)

    await expect(cardTitled(page, "Untitled card")).toHaveCount(1)
    await page.reload()
    await expect(cardTitled(page, "Untitled card")).toHaveCount(1)
  })

  test("an existing card emptied out is kept", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do", "Plan")

    await openCard(page, "Plan")
    await panelField(page, "Title").fill("")
    await closeCard(page)

    await expect(cardTitled(page, "Untitled card")).toHaveCount(1)
    await page.reload()
    await expect(cardTitled(page, "Untitled card")).toHaveCount(1)
  })
})
