import { test, expect } from "@playwright/test"
import {
  addCard,
  addColumn,
  column,
  columnCardTitles,
  createBoard,
  deleteColumn,
  renameColumn,
} from "./helpers"

test.describe("column lifecycle", () => {
  test("adding a column appends it and it persists across a reload", async ({
    page,
  }) => {
    // A fresh board lands with the three default columns.
    await createBoard(page)
    await expect(column(page, "To Do")).toBeVisible()
    await expect(column(page, "In Progress")).toBeVisible()
    await expect(column(page, "Done")).toBeVisible()

    await addColumn(page)
    await expect(column(page, "New column")).toBeVisible()

    // It survives a reload (IndexedDB round-trip).
    await page.reload()
    await expect(column(page, "New column")).toBeVisible()
  })

  test("renaming a column persists across a reload", async ({ page }) => {
    await createBoard(page)
    await addColumn(page)

    await renameColumn(page, "New column", "Backlog")
    await expect(column(page, "Backlog")).toBeVisible()
    await expect(column(page, "New column")).toHaveCount(0)

    await page.reload()
    await expect(column(page, "Backlog")).toBeVisible()
  })

  test("deleting a column removes it and its cards, and persists", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addColumn(page)
    await renameColumn(page, "New column", "Doomed")

    // Give it a card so there's real content riding along with the column,
    // proving the delete cascades to the cards inside it.
    await addCard(page, "Doomed")
    await expect
      .poll(() => columnCardTitles(page, "Doomed"))
      .toEqual(["Untitled card"])

    await deleteColumn(page, "Doomed")
    await expect(column(page, "Doomed")).toHaveCount(0)
    // The card it held is gone too, not orphaned onto the board.
    await expect(page.getByText("Untitled card")).toHaveCount(0)

    // The deletion (column and its card) is durable across a reload.
    await page.goto(`/d/${deckId}`)
    await expect(column(page, "To Do")).toBeVisible()
    await expect(column(page, "Doomed")).toHaveCount(0)
    await expect(page.getByText("Untitled card")).toHaveCount(0)
  })
})
