import { test, expect } from "@playwright/test"
import { boardColumnNames, createBoard, reorderColumn } from "../helpers"

/**
 * Columns are reordered from a dedicated "Reorder columns" modal (dragging the
 * column blocks vertically), separate from the card drag-and-drop on the board.
 * Tests assert on the left-to-right column order a user sees, not on positions
 * or ids.
 */
test.describe("column reorder", () => {
  test("moving a column down changes the board order and persists", async ({
    page,
  }) => {
    await createBoard(page)
    await expect
      .poll(() => boardColumnNames(page))
      .toEqual(["To Do", "In Progress", "Done"])

    // Drag "To Do" down one slot in the reorder modal.
    await reorderColumn(page, "To Do", ["ArrowDown"])
    await expect
      .poll(() => boardColumnNames(page))
      .toEqual(["In Progress", "To Do", "Done"])

    // The new order is durable across a reload.
    await page.reload()
    await expect
      .poll(() => boardColumnNames(page))
      .toEqual(["In Progress", "To Do", "Done"])
  })
})
