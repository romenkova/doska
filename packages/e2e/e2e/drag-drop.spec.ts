import { test, expect } from "@playwright/test"
import {
  addCard,
  columnCardTitles,
  createBoard,
  dragCardByTitle,
  retitleCard,
} from "./helpers"

/**
 * @hello-pangea/dnd has first-class keyboard dragging, which is far more
 * reliable to drive than synthesized mouse moves: focus a card, Space to lift,
 * arrow to move, Space to drop.
 *
 * Tests seed cards with distinct titles and assert on the titles a user sees in
 * each named column — never on internal card/column ids.
 */
test.describe("drag and drop", () => {
  test("reordering a card within a column persists", async ({ page }) => {
    await createBoard(page)
    // New cards land at the top, so adding Third, then Second, then First
    // leaves "To Do" reading First, Second, Third.
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Third")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Second")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "First")
    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["First", "Second", "Third"])

    // Lift the first card and move it down one slot.
    await dragCardByTitle(page, "First", ["ArrowDown"])
    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["Second", "First", "Third"])

    // The new arrangement is durable.
    await page.reload()
    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["Second", "First", "Third"])
  })

  test("moving a card to another column persists", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Roamer")
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual(["Roamer"])

    // Lift the card and move it right into the next column (In Progress).
    await dragCardByTitle(page, "Roamer", ["ArrowRight"])
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toContain("Roamer")

    // Durable across reload.
    await page.reload()
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toContain("Roamer")
  })
})
