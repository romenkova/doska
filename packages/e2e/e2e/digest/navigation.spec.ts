import { test, expect, type Page } from "@playwright/test"
import { addCard, createBoard, renameBoard, retitleCard } from "../helpers"

/** The native date input only renders below the 768px breakpoint. */
function deadlineInput(page: Page, title: string) {
  return page
    .locator("[data-rfd-draggable-id]", { hasText: title })
    .locator('input[type="date"]')
}

/** Local `YYYY-MM-DD` for today. */
function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, "0")}`
}

test.describe("digest navigation", () => {
  test("the sidebar's Upcoming entry opens the digest", async ({ page }) => {
    await createBoard(page)

    await page.getByRole("button", { name: "Upcoming" }).click()
    await page.waitForURL(/\/digest/)
    await expect(page.getByRole("button", { name: "Hide done" })).toBeVisible()
  })

  test("a digest row's board link opens that card's board", async ({ page }) => {
    const deckId = await createBoard(page)
    await renameBoard(page, "Untitled board", "Roadmap")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Due soon")

    // The native date input only renders below the 768px breakpoint.
    await page.setViewportSize({ width: 500, height: 900 })
    await deadlineInput(page, "Due soon").fill(todayIso())

    await page.goto("/digest")
    // Scoped to the row: the sidebar carries the board name too.
    const row = page.getByRole("button", { name: /Due soon/ })
    await row.getByRole("button", { name: "Roadmap", exact: true }).click()

    await page.waitForURL(new RegExp(`/d/${deckId}`))
    await expect(page.getByRole("button", { name: "Add column" })).toBeVisible()
  })
})
