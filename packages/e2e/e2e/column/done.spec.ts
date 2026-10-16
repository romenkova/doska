import { test, expect } from "@playwright/test"
import {
  addCard,
  columnDoneBadge,
  createBoard,
  digestRow,
  retitleCard,
  setColumnDone,
  setDeadline,
} from "../helpers"

test.describe("marking a column done", () => {
  test("badges the column and persists across reload", async ({ page }) => {
    await createBoard(page)

    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)

    await setColumnDone(page, "Done", true)

    await page.reload()
    await expect(columnDoneBadge(page, "Done")).toBeVisible()
  })

  test("un-marking a done column clears the flag", async ({ page }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await setColumnDone(page, "Done", false)

    await page.reload()
    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)
  })

  test("marking a second column done keeps the first", async ({ page }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await setColumnDone(page, "In Progress", true)

    await expect(columnDoneBadge(page, "Done")).toBeVisible()

    await page.reload()
    await expect(columnDoneBadge(page, "In Progress")).toBeVisible()
    await expect(columnDoneBadge(page, "Done")).toBeVisible()
  })

  test("a card in a done column reads as done in the digest", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Wrapped up")

    await setDeadline(page, "Wrapped up", "Today")

    // Undone column first: the digest row carries no strikethrough.
    await page.goto("/digest")
    let row = digestRow(page, "Wrapped up")
    await expect(row).toBeVisible()
    await expect(row.getByRole("checkbox")).not.toBeChecked()

    // Mark the column done and the same row now renders struck through.
    await page.goto(`/d/${deckId}`)
    await setColumnDone(page, "In Progress", true)

    await page.goto("/digest")
    row = digestRow(page, "Wrapped up")
    await expect(row.getByRole("checkbox")).toBeChecked()
  })

  test("the digest names a done column when the board has none", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Needs a done column")

    await setDeadline(page, "Needs a done column", "Today")

    // No done column yet, so the row's tick box explains itself instead. The
    // seeded Welcome board has none either, hence the scoping to this row.
    await page.goto("/digest")
    const row = digestRow(page, "Needs a done column")
    const help = row.getByRole("checkbox", {
      name: "How marking cards done works",
    })
    await expect(help).not.toBeChecked()
    await help.click()

    // The modal hides the rest of the page from the a11y tree, so the row is
    // only reachable again once a column is picked and the dialog closes.
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Done", exact: true }).click()

    // Picking one turns the same box into a working checkbox.
    const checkbox = row.getByRole("checkbox", { name: "Toggle done" })
    await expect(checkbox).toBeVisible()
    await checkbox.click()
    await expect(
      row.getByRole("checkbox", { name: "Toggle done" })
    ).toBeChecked()

    // The flag is the board's, not the digest's: it shows up on the column too.
    await page.goto(`/d/${deckId}`)
    await expect(columnDoneBadge(page, "Done")).toBeVisible()
  })
})
