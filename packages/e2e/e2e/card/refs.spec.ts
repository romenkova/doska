import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardDisplayId,
  cardPanel,
  cardRef,
  cardTitled,
  createBoard,
  editCardBody,
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
async function boardWithTwoCards(page: Page) {
  await signIn(page)
  await createBoard(page)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Target card")
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Source card")
  return {
    targetId: await cardDisplayId(page, "Target card"),
    sourceId: await cardDisplayId(page, "Source card"),
  }
}

/**
 * A row in the `[[` menu. Matched on title *and* display id — both of which the
 * row shows — because the board card behind the menu is also a `button` carrying
 * the same title.
 */
function refMenuItem(page: Page, title: string, displayId: string) {
  return page.getByRole("button", { name: `${title} ${displayId}` })
}

test.describe("card references", () => {
  test("the [[ menu inserts the referenced card's display id", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("[[Target")

    const item = refMenuItem(page, "Target card", targetId)
    await expect(item).toBeVisible()
    await item.click()

    await expect(notes).toHaveValue(`[[${targetId}]]`)
  })

  test("the menu filters by title and leaves out the card being edited", async ({
    page,
  }) => {
    const { targetId, sourceId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    await expect(refMenuItem(page, "Target card", targetId)).toBeVisible()
    // A card referencing itself is never useful, so it isn't offered.
    await expect(refMenuItem(page, "Source card", sourceId)).toHaveCount(0)

    await notes.pressSequentially("nothing matches this")
    await expect(refMenuItem(page, "Target card", targetId)).toHaveCount(0)
  })

  test("renders the target's id, title and column, and follows a re-title", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `Blocked by [[${targetId}]]`)

    const ref = cardRef(page, "Target card")
    await expect(ref).toBeVisible()
    await expect(ref).toContainText(targetId)
    // The column the target currently sits in, rendered as the trailing pill.
    await expect(ref).toContainText(/To Do/i)

    // Nothing but the id is stored in the text, so a rename propagates. Opened
    // via `cardTitled`: the source card's body now renders the target's title
    // too, so a plain `card()` would match both.
    await cardTitled(page, "Target card").click()
    await expect(cardPanel(page)).toBeVisible()
    await page.getByPlaceholder("Title").fill("Renamed target")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(cardRef(page, "Renamed target")).toBeVisible()
  })

  test("the rendered reference picks up the target column's color", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `See [[${targetId}]]`)

    const badge = cardRef(page, "Target card").locator(".wikilink-badge")
    const color = () =>
      badge.evaluate(
        (el) => el.ownerDocument.defaultView!.getComputedStyle(el).color
      )
    const before = await color()

    await setColumnColor(page, "To Do", "Violet")

    await expect.poll(color).not.toBe(before)
  })

  test("clicking a reference opens the card it points at", async ({ page }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `Blocked by [[${targetId}]]`)

    await cardRef(page, "Target card").click()

    // The target opens, not the card whose body was clicked.
    await expect(cardPanel(page)).toBeVisible()
    await expect(page.getByPlaceholder("Title")).toHaveValue("Target card")
  })

  test("a reference to a card that no longer exists stays visible", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    await editCardBody(page, "Source card", "Blocked by [[NOPE-999]]")

    // A broken reference should look broken, not silently render as plain text.
    await expect(card(page, "Source card").getByText("NOPE-999")).toBeVisible()
  })
})
