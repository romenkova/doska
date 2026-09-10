import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  columnCardTitles,
  createBoard,
  fieldText,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * The card's "⋯" menu. Delete is exercised by the lifecycle spec; this covers
 * the other two ways in — Edit, and the "Move to" submenu, which is the only
 * way to move a card without dragging it.
 */
test.describe("card actions menu", () => {
  test("Move to puts the card in the chosen column", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan launch")

    await card(page, "Plan launch")
      .getByRole("button", { name: "Card actions" })
      .click()
    await page.getByRole("menuitem", { name: "Move to" }).click()
    await page.getByRole("menuitem", { name: "In Progress" }).click()

    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Plan launch"])
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])

    await page.reload()
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Plan launch"])
  })

  test("the column the card is already in can't be picked", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Stay put")

    await card(page, "Stay put")
      .getByRole("button", { name: "Card actions" })
      .click()
    await page.getByRole("menuitem", { name: "Move to" }).click()

    await expect(page.getByRole("menuitem", { name: "To Do" })).toBeDisabled()
    await expect(
      page.getByRole("menuitem", { name: "In Progress" })
    ).toBeEnabled()
  })

  test("Edit opens the card in the panel", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Open me")

    await card(page, "Open me")
      .getByRole("button", { name: "Card actions" })
      .click()
    await page.getByRole("menuitem", { name: "Edit" }).click()

    await expect(cardPanel(page)).toBeVisible()
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Open me")
  })
})
