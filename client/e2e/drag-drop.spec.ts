import { test, expect } from "@playwright/test"
import { addCard, cardIds, columnIds, createBoard, keyboardDrag } from "./helpers"

/**
 * @hello-pangea/dnd has first-class keyboard dragging, which is far more
 * reliable to drive than synthesized mouse moves: focus a card, Space to lift,
 * arrow to move, Space to drop.
 *
 * Each test creates its own board and seeds exactly the cards it needs, then
 * derives columns and cards from the rendered board rather than hardcoding
 * ids/titles, so they don't break when the seed data changes.
 */
test.describe("drag and drop", () => {
  test("reordering a card within a column persists", async ({ page }) => {
    // Seed two cards in one column so there's something to reorder.
    await createBoard(page)
    await addCard(page, "To Do")
    await addCard(page, "To Do")

    // Pick the first column that has at least two cards to reorder.
    const columns = await columnIds(page)
    let column = ""
    let order: string[] = []
    for (const id of columns) {
      const ids = await cardIds(page, id)
      if (ids.length >= 2) {
        column = id
        order = ids
        break
      }
    }
    expect(column, "need a column with >= 2 cards to reorder").not.toBe("")

    const [first, second, ...rest] = order

    // Lift the first card and move it down one slot.
    await keyboardDrag(page, first, ["ArrowDown"])

    const expected = [second, first, ...rest]
    await expect.poll(() => cardIds(page, column)).toEqual(expected)

    // The new arrangement is durable.
    await page.reload()
    await expect.poll(() => cardIds(page, column)).toEqual(expected)
  })

  test("moving a card to another column persists", async ({ page }) => {
    // Seed a single card in the first column to move into the next one.
    await createBoard(page)
    await addCard(page, "To Do")

    const columns = await columnIds(page)
    // Source: first non-empty column that has a column to its right.
    let fromIndex = -1
    let source: string[] = []
    for (let i = 0; i < columns.length - 1; i++) {
      const ids = await cardIds(page, columns[i])
      if (ids.length > 0) {
        fromIndex = i
        source = ids
        break
      }
    }
    expect(fromIndex, "need a non-last, non-empty column to move from").not.toBe(
      -1
    )

    const from = columns[fromIndex]
    const to = columns[fromIndex + 1]
    const moved = source[0]

    // Lift the first card and move it right into the next column.
    await keyboardDrag(page, moved, ["ArrowRight"])

    await expect.poll(() => cardIds(page, from)).toEqual(source.slice(1))
    await expect.poll(() => cardIds(page, to)).toContain(moved)

    // Durable across reload.
    await page.reload()
    await expect.poll(() => cardIds(page, from)).not.toContain(moved)
    await expect.poll(() => cardIds(page, to)).toContain(moved)
  })
})
