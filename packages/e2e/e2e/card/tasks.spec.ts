import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * A card body written as a GFM task list ("- [ ] ...") gets a progress badge on
 * the board card, and its checkboxes are tickable straight from the board (no
 * need to open the editor). Tests read the "done/total" badge a user sees and
 * tick the visible boxes, never the markdown source.
 */
test.describe("card tasks", () => {
  test("a task list shows a progress badge and ticking a box updates it", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Checklist")
    await editCardBody(page, "Checklist", "- [ ] First\n- [ ] Second")

    const target = card(page, "Checklist")
    // Two open tasks → 0 of 2 done.
    await expect(target).toContainText("0/2")

    // Tick the first checkbox right on the board card. The box is driven by the
    // markdown source, so assert on the progress badge rather than the input's
    // own checked state.
    await target.getByRole("checkbox").first().click()
    await expect(target).toContainText("1/2")

    // The tick is stored, so it survives a reload.
    await page.reload()
    await expect(card(page, "Checklist")).toContainText("1/2")
  })

  test("clicking a task's label in card preview ticks it", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Labels")
    await editCardBody(page, "Labels", "- [ ] First\n- [ ] Second")

    // A plain click opens a card with a body in preview.
    await card(page, "Labels").click()
    const preview = cardPanel(page)
    await expect(
      page.getByRole("button", { name: "Edit", exact: true })
    ).toBeVisible()

    await preview.getByText("First", { exact: true }).click()
    await expect(card(page, "Labels")).toContainText("1/2")
    // Still in preview: the click ticked the box instead of opening the editor.
    await expect(panelField(page, "Notes")).toHaveCount(0)

    await preview.getByText("First", { exact: true }).click()
    await expect(card(page, "Labels")).toContainText("0/2")
  })

  test("a fully checked list reads as complete", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Done list")
    await editCardBody(page, "Done list", "- [x] One\n- [x] Two")

    await expect(card(page, "Done list")).toContainText("2/2")
  })

  test("a plain note shows no task badge", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Just prose")
    await editCardBody(page, "Just prose", "No checkboxes here")

    // No task syntax → no checkboxes and no "done/total" badge.
    await expect(card(page, "Just prose").getByRole("checkbox")).toHaveCount(0)
  })
})
