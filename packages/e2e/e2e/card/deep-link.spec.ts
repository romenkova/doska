import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  fieldText,
  openCard,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * The open card lives in the URL (`/d/:deckId/c/:cardId`), so it is shareable
 * and survives a reload. These drive it the way a user does: open a card, copy
 * what's in the address bar, and come back to it.
 */
test.describe("card deep link", () => {
  test("the card's URL opens straight into its panel", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan launch")

    await openCard(page, "Plan launch")
    const cardUrl = page.url()
    expect(cardUrl).toMatch(/\/d\/board-[^/]+\/c\/card-/)

    // Leave the board entirely, then come back through the link alone.
    await page.goto("/")
    await expect(cardPanel(page)).toHaveCount(0)

    await page.goto(cardUrl)
    await expect(cardPanel(page)).toBeVisible()
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Plan launch")
  })

  test("reloading with a card open reopens the same card", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Still here")

    await openCard(page, "Still here")
    await page.reload()

    await expect(cardPanel(page)).toBeVisible()
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Still here")
  })

  test("Escape closes the panel and returns to the board's URL", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Close me")

    await openCard(page, "Close me")
    await page.keyboard.press("Escape")

    await expect(page).toHaveURL(new RegExp(`/d/${deckId}$`))
    await expect(panelField(page, "Title")).toHaveCount(0)
    await expect(card(page, "Close me")).toBeVisible()
  })

  test("the close button does the same as Escape", async ({ page }) => {
    const deckId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Close me too")

    await openCard(page, "Close me too")
    await cardPanel(page).getByRole("button", { name: "Close card" }).click()

    await expect(page).toHaveURL(new RegExp(`/d/${deckId}$`))
    await expect(panelField(page, "Title")).toHaveCount(0)
  })

  test("a link to a card that no longer exists leaves the board usable", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Doomed")

    await openCard(page, "Doomed")
    const cardUrl = page.url()
    await page.keyboard.press("Escape")

    await card(page, "Doomed")
      .getByRole("button", { name: "Card actions" })
      .click()
    await page.getByRole("menuitem", { name: "Delete" }).click()
    await expect(card(page, "Doomed")).toHaveCount(0)

    // The stale link still lands on the board, with nothing to edit in the panel.
    await page.goto(cardUrl)
    await expect(panelField(page, "Title")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Add card to To Do" })
    ).toBeVisible()
    expect(page.url()).toContain(`/d/${deckId}`)
  })
})
