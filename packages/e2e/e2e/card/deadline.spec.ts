import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardTitled,
  createBoard,
  setDeadline,
} from "../helpers"

const UPCOMING = weekOut()

function weekOut() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const sameYear = year === new Date().getFullYear()
  return sameYear ? `${day}.${month}` : `${day}.${month}.${year}`
}

test.describe("card deadline", () => {
  test("setting a future deadline shows the upcoming date", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await setDeadline(page, "Untitled card", "In a week")

    await expect(card(page, "Untitled card").getByText(UPCOMING)).toBeVisible()
  })

  test("an overdue deadline is colour-coded distinctly from an upcoming one", async ({
    page,
  }) => {
    await page.goto("/d/welcome")

    // The colour class sits on the chip wrapper, one level above the label.
    const overdueChip = cardTitled(page, "Deadlines")
      .getByText(/days ago/)
      .locator("..")
    await expect(overdueChip).toBeVisible()
    await expect(overdueChip).toHaveClass(/text-destructive/)

    await setDeadline(page, "Deadlines", "In a week")
    const upcomingChip = cardTitled(page, "Deadlines")
      .getByText(UPCOMING)
      .locator("..")
    await expect(upcomingChip).not.toHaveClass(/text-destructive/)
  })

  test("a deadline persists across reload", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await setDeadline(page, "Untitled card", "In a week")
    await expect(card(page, "Untitled card").getByText(UPCOMING)).toBeVisible()

    await page.reload()
    await expect(card(page, "Untitled card").getByText(UPCOMING)).toBeVisible()
  })
})
