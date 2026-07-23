import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard } from "../helpers"

// The overlay input has no accessible name, so it's reached by its type attribute.
function deadlineInput(page: Page) {
  return card(page, "Untitled card").locator('input[type="date"]')
}

// DateInput only renders the native input below the 768px breakpoint; above it the calendar popover is harder to drive.
test.describe("card deadline", () => {
  test.use({ viewport: { width: 500, height: 800 } })

  test("setting a future deadline shows the upcoming date", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill("2026-08-15")

    await expect(card(page, "Untitled card").getByText("15.08.2026")).toBeVisible()
  })

  test("an overdue deadline is colour-coded distinctly from an upcoming one", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill("2020-01-01")

    // An overdue deadline reads as the relative label ("overdue"), not the date.
    const overdueChip = card(page, "Untitled card").getByText("overdue")
    await expect(overdueChip).toBeVisible()
    await expect(overdueChip).toHaveClass(/text-destructive/)

    await deadlineInput(page).fill("2026-08-15")
    const upcomingChip = card(page, "Untitled card").getByText("15.08.2026")
    await expect(upcomingChip).not.toHaveClass(/text-destructive/)
  })

  test("a deadline persists across reload", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill("2026-08-15")
    await expect(card(page, "Untitled card").getByText("15.08.2026")).toBeVisible()

    await page.reload()
    await expect(card(page, "Untitled card").getByText("15.08.2026")).toBeVisible()
  })
})
