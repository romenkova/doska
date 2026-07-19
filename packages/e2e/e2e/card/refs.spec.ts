import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardDisplayId,
  cardPanel,
  cardRef,
  createBoard,
  openCard,
  retitleCard,
  setColumnColor,
  signIn,
} from "../helpers"

/**
 * References store the target's display id, which the server only stamps on
 * sync — so every test here needs a signed-in board. Type with
 * `pressSequentially`, not `fill`: the `[[` menu is driven by the textarea's own
 * input/keyup events.
 */
async function boardWithTwoCards(page: Page): Promise<void> {
  await signIn(page)
  await createBoard(page)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Target card")
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Source card")
}

test.describe("card references", () => {
  test("the [[ menu inserts the referenced card's display id", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    const targetId = await cardDisplayId(page, "Target card")

    await openCard(page, "Source card")
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("[[Target")

    const item = page.getByRole("button", { name: /Target card/ })
    await expect(item).toBeVisible()
    await item.click()

    await expect(notes).toHaveValue(`[[${targetId}]] `)
  })

  test("the menu filters by title and leaves out the card being edited", async ({
    page,
  }) => {
    await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    await expect(page.getByRole("button", { name: /Target card/ })).toBeVisible()
    // A card referencing itself is never useful, so it isn't offered.
    await expect(page.getByRole("button", { name: /Source card/ })).toHaveCount(0)

    await notes.pressSequentially("Nothing matches this")
    await expect(page.getByRole("button", { name: /Target card/ })).toHaveCount(0)
  })

  test("renders the target's title and column, and follows a re-title", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    const targetId = await cardDisplayId(page, "Target card")

    await openCard(page, "Source card")
    await page.getByPlaceholder("Notes").fill(`Blocked by [[${targetId}]]`)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(cardPanel(page)).toHaveCount(0)

    const ref = cardRef(page, "Target card")
    await expect(ref).toBeVisible()
    // The id, the live title and the column the target sits in.
    await expect(ref).toContainText(targetId)
    await expect(ref).toContainText(/To Do/i)

    // Nothing but the id is stored in the text, so a rename propagates.
    await retitleCard(page, "Target card", "Renamed target")
    await expect(cardRef(page, "Renamed target")).toBeVisible()
  })

  test("the rendered reference picks up the target column's color", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    const targetId = await cardDisplayId(page, "Target card")

    await openCard(page, "Source card")
    await page.getByPlaceholder("Notes").fill(`See [[${targetId}]]`)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(cardPanel(page)).toHaveCount(0)

    const badge = cardRef(page, "Target card").locator(".wikilink-badge")
    const before = await badge.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).color)

    await setColumnColor(page, "To Do", "Violet")

    await expect
      .poll(() => badge.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).color))
      .not.toBe(before)
  })

  test("clicking a reference opens the card it points at", async ({ page }) => {
    await boardWithTwoCards(page)
    const targetId = await cardDisplayId(page, "Target card")

    await openCard(page, "Source card")
    await page.getByPlaceholder("Notes").fill(`Blocked by [[${targetId}]]`)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(cardPanel(page)).toHaveCount(0)

    await cardRef(page, "Target card").click()

    // The target opens, not the card whose body was clicked.
    await expect(cardPanel(page)).toBeVisible()
    await expect(page.getByPlaceholder("Title")).toHaveValue("Target card")
  })

  test("a reference to a card that no longer exists stays visible", async ({
    page,
  }) => {
    await boardWithTwoCards(page)

    await openCard(page, "Source card")
    await page.getByPlaceholder("Notes").fill("Blocked by [[NOPE-999]]")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(cardPanel(page)).toHaveCount(0)

    // A broken reference should look broken, not silently render as plain text.
    await expect(card(page, "Source card").getByText("NOPE-999")).toBeVisible()
  })
})
