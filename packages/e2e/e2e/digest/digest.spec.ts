import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard } from "../helpers"

// DateInput only renders the native input below the 768px breakpoint.
function deadlineInput(page: Page) {
  return card(page, "Untitled card").locator('input[type="date"]')
}

/** Local `YYYY-MM-DD`, `days` from today — the same reference the digest uses. */
function isoIn(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, "0")}`
}

/** A filter chip, scoped to the header — a row due today reads "… today", which
 * a bare name match confuses with the "Today" chip. */
function filterChip(page: Page, name: string) {
  return page.locator("header").getByRole("button", { name, exact: true })
}

function digestRow(page: Page, title: string) {
  return page.getByRole("button", { name: new RegExp(title) })
}

test.describe("digest", () => {
  test.use({ viewport: { width: 500, height: 800 } })

  test("a card due in three days shows under Upcoming", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await deadlineInput(page).fill(isoIn(3))

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })

  test("a card due today shows under Today", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await deadlineInput(page).fill(isoIn(0))

    await page.goto("/digest")
    await filterChip(page, "Today").click()
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })

  test("a card past its deadline lands in the overdue group", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await deadlineInput(page).fill(isoIn(-30))

    await page.goto("/digest")
    const overdue = page.getByRole("heading", { name: "Overdue" })
    await expect(overdue).toBeVisible()
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })

  test("a card past the upcoming range is not shown", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await deadlineInput(page).fill(isoIn(90))

    await page.goto("/digest")
    // Not asserted as empty: the seeded demo board carries an overdue card of
    // its own, which the range is right to show.
    await expect(digestRow(page, "Untitled card")).toHaveCount(0)
  })

  test("a deadline set before the digest ever opened is still indexed", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await deadlineInput(page).fill(isoIn(2))
    await page.reload()

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })
})
