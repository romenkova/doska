import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  columnDoneToggle,
  createBoard,
  retitleCard,
  setColumnDone,
} from "../helpers"

/** The native date input only renders below the 768px breakpoint. */
function deadlineInput(page: Page, title: string) {
  return page
    .locator("[data-rfd-draggable-id]", { hasText: title })
    .locator('input[type="date"]')
}

/** Local `YYYY-MM-DD` for today — the reference the digest ranges against. */
function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, "0")}`
}

test.describe("marking a column done", () => {
  test("toggles the header control and persists across reload", async ({
    page,
  }) => {
    await createBoard(page)

    const toggle = columnDoneToggle(page, "Done")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")

    await setColumnDone(page, "Done", true)

    await page.reload()
    await expect(columnDoneToggle(page, "Done")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("un-marking a done column clears the flag", async ({ page }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await setColumnDone(page, "Done", false)

    await page.reload()
    await expect(columnDoneToggle(page, "Done")).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  test("a card in a done column reads as done in the digest", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Wrapped up")

    // The native date input only renders below the 768px breakpoint.
    await page.setViewportSize({ width: 500, height: 900 })
    await deadlineInput(page, "Wrapped up").fill(todayIso())

    // Undone column first: the digest row carries no strikethrough.
    await page.goto("/digest")
    let row = page.getByRole("button", { name: /Wrapped up/ })
    await expect(row).toBeVisible()
    await expect(row.locator(".line-through")).toHaveCount(0)

    // Mark the column done and the same row now renders struck through.
    await page.goto(`/d/${deckId}`)
    await setColumnDone(page, "In Progress", true)

    await page.goto("/digest")
    row = page.getByRole("button", { name: /Wrapped up/ })
    await expect(row.locator(".line-through")).toHaveText("Wrapped up")
  })
})
