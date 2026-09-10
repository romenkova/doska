import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardDisplayId,
  cardPanel,
  cardRef,
  cardTitled,
  closeCard,
  createBoard,
  editCardBody,
  fieldText,
  openCard,
  panelField,
  retitleCard,
  setColumnColor,
  signIn,
} from "../helpers"

/**
 * References store the target's display id, which the server only stamps on
 * sync — so every test here needs a signed-in board. Type with
 * `pressSequentially`, not `fill`: the `[[` menu opens on typed input.
 */
async function boardWithCards(
  page: Page,
  titles: string[]
): Promise<Record<string, string>> {
  await signIn(page)
  await createBoard(page)
  // One at a time: a second untitled card would make "Untitled card" ambiguous.
  for (const title of titles) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
  }
  const ids: Record<string, string> = {}
  for (const title of titles) ids[title] = await cardDisplayId(page, title)
  return ids
}

async function boardWithTwoCards(page: Page) {
  const ids = await boardWithCards(page, ["Target card", "Source card"])
  return { targetId: ids["Target card"], sourceId: ids["Source card"] }
}

/** A row in the `[[` menu, matched on the title and display id it shows. */
function refMenuItem(page: Page, title: string, displayId: string) {
  return page.getByRole("option", { name: `${title} #${displayId}` })
}

/**
 * Every row of the open `[[` menu, in the order shown. Scoped to the panel and
 * to names ending in a `#id`. The board order the rows come in isn't fixed, so
 * tests that care about position read it off these rows rather than assuming it.
 */
function refMenuRows(page: Page): Locator {
  return cardPanel(page).getByRole("option", { name: /#\d+$/ })
}

/**
 * The menu ignores keys for its first 75ms, so a keystroke already in flight
 * can't pick a row by accident. Take the beat a person would before pressing.
 */
function letMenuSettle(page: Page): Promise<void> {
  return page.waitForTimeout(100)
}

/** The display id a menu row offers, read out of the row's text. */
function rowDisplayId(text: string): string {
  const id = text.match(/#(\d+)/)
  if (!id) throw new Error(`no display id in menu row "${text}"`)
  return id[1]
}

/** What picking a menu row writes: the target's id, plus its title as an alias. */
function rowInsertion(text: string): string {
  const id = rowDisplayId(text)
  return `[[${id}|${text.replace(`#${id}`, "").trim()}]]`
}

/** A card's "⋯" menu, reached by title alone — a referencing card renders the target's title too. */
async function openCardMenu(page: Page, title: string) {
  await cardTitled(page, title)
    .getByRole("button", { name: "Card actions" })
    .click()
  await expect(page.getByRole("menu")).toBeVisible()
}

test.describe("card references", () => {
  test("the [[ menu inserts the target's display id and title", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[Target")

    const item = refMenuItem(page, "Target card", targetId)
    await expect(item).toBeVisible()
    await item.click()

    // The title goes in as an alias so the body reads as prose while editing.
    await expect
      .poll(() => fieldText(notes))
      .toBe(`[[${targetId}|Target card]]`)
  })

  test("the menu filters by title and leaves out the card being edited", async ({
    page,
  }) => {
    const { targetId, sourceId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    await expect(refMenuItem(page, "Target card", targetId)).toBeVisible()
    // A card referencing itself is never useful, so it isn't offered.
    await expect(refMenuItem(page, "Source card", sourceId)).toHaveCount(0)

    await notes.pressSequentially("nothing matches this")
    await expect(refMenuItem(page, "Target card", targetId)).toHaveCount(0)
  })

  test("renders the target's title and column, and follows a re-title", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `Blocked by [[${targetId}]]`)

    const ref = cardRef(page, "Target card")
    await expect(ref).toBeVisible()
    // The column the target sits in is a color bar plus the hover title; only
    // the title spells the column out.
    await expect(ref).toHaveAttribute("title", /To Do/i)

    // Nothing but the id is stored in the text, so a rename propagates. Opened
    // via `cardTitled`: the source card's body now renders the target's title
    // too, so a plain `card()` would match both.
    await cardTitled(page, "Target card").click()
    await expect(cardPanel(page)).toBeVisible()
    await panelField(page, "Title").fill("Renamed target")
    await closeCard(page)

    await expect(cardRef(page, "Renamed target")).toBeVisible()
  })

  test("an alias pins the wording, so a re-title leaves it alone", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(
      page,
      "Source card",
      `Blocked by [[${targetId}|Fix the sync bug]]`
    )

    const ref = cardRef(page, "Fix the sync bug")
    await expect(ref).toBeVisible()

    await cardTitled(page, "Target card").click()
    await expect(cardPanel(page)).toBeVisible()
    await panelField(page, "Title").fill("Renamed target")
    await closeCard(page)

    // The alias is a snapshot the writer chose; nothing rewrites it.
    await expect(cardRef(page, "Fix the sync bug")).toBeVisible()
    await expect(cardRef(page, "Renamed target")).toHaveCount(0)
  })

  test("a broken reference with an alias shows the id alongside it", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    await editCardBody(page, "Source card", "Blocked by [[NOPE-999|Some card]]")

    // The alias is the only place that wording survives, but the id is what
    // you need to fix the link, so both stay on screen.
    const body = card(page, "Source card")
    await expect(body.getByText("NOPE-999", { exact: false })).toBeVisible()
    await expect(body.getByText("Some card", { exact: false })).toBeVisible()
  })

  test("the rendered reference picks up the target column's color", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `See [[${targetId}]]`)

    const badge = cardRef(page, "Target card").locator(".wikilink-badge")
    const color = () =>
      badge.evaluate(
        (el) =>
          el.ownerDocument.defaultView!.getComputedStyle(el).backgroundColor
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
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Target card")
  })

  test("a reference to a card that no longer exists stays visible", async ({
    page,
  }) => {
    await boardWithTwoCards(page)
    await editCardBody(page, "Source card", "Blocked by [[NOPE-999]]")

    // A broken reference should look broken, not silently render as plain text.
    await expect(card(page, "Source card").getByText("NOPE-999")).toBeVisible()
  })

  test("the menu also filters by display id, not just title", async ({
    page,
  }) => {
    const ids = await boardWithCards(page, ["Alpha", "Beta", "Source card"])

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially(`[[${ids["Beta"]}`)

    // Someone who already knows the id types it instead of the title.
    await expect(refMenuItem(page, "Beta", ids["Beta"])).toBeVisible()
    await expect(refMenuItem(page, "Alpha", ids["Alpha"])).toHaveCount(0)
  })

  test("the arrow keys move down the menu and Enter picks the row", async ({
    page,
  }) => {
    await boardWithCards(page, ["Alpha", "Beta", "Source card"])

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    const rows = refMenuRows(page)
    await expect(rows).toHaveCount(2)
    const second = rowInsertion((await rows.allInnerTexts())[1])

    await letMenuSettle(page)
    await notes.press("ArrowDown")
    await notes.press("Enter")

    await expect.poll(() => fieldText(notes)).toBe(second)
  })

  test("the highlight wraps around the ends and Tab picks the row", async ({
    page,
  }) => {
    await boardWithCards(page, ["Alpha", "Beta", "Source card"])

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    const rows = refMenuRows(page)
    await expect(rows).toHaveCount(2)
    const first = rowInsertion((await rows.allInnerTexts())[0])

    // Two rows, so a second ArrowDown wraps back to the first.
    await letMenuSettle(page)
    await notes.press("ArrowDown")
    await notes.press("ArrowDown")
    await notes.press("Tab")

    await expect.poll(() => fieldText(notes)).toBe(first)
  })

  test("Enter picks the row inside a list item, without continuing the list", async ({
    page,
  }) => {
    const ids = await boardWithCards(page, ["Alpha", "Source card"])

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("- todo [[Alph")
    await expect(refMenuItem(page, "Alpha", ids["Alpha"])).toBeVisible()

    await letMenuSettle(page)
    await notes.press("Enter")

    await expect
      .poll(() => fieldText(notes))
      .toBe(`- todo [[${ids["Alpha"]}|Alpha]]`)
  })

  test("Escape closes the menu, leaves the panel open, and keeps it shut until the text changes", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")
    await expect(refMenuItem(page, "Target card", targetId)).toBeVisible()

    await notes.press("Escape")

    // The panel's own Escape handler must not fire as well.
    await expect(refMenuRows(page)).toHaveCount(0)
    await expect(cardPanel(page)).toBeVisible()

    // Clicking back into the same text doesn't bring the menu back...
    await notes.click()
    await expect(refMenuRows(page)).toHaveCount(0)

    // ...but typing does. The click parked the caret at the end of the text,
    // so step back inside the auto-closed `]]` first.
    await notes.press("ArrowLeft")
    await notes.press("ArrowLeft")
    await notes.pressSequentially("Target")
    await expect(refMenuItem(page, "Target card", targetId)).toBeVisible()
  })

  test("picking a row mid-line keeps the rest of the text and lands the caret after the link", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("Blocked by  soon")
    // Back to just after "by ", leaving " soon" to the right of the caret.
    for (let i = 0; i < 5; i++) await notes.press("ArrowLeft")
    await notes.pressSequentially("[[Targ")

    const ref = `[[${targetId}|Target card]]`
    await refMenuItem(page, "Target card", targetId).click()
    await expect.poll(() => fieldText(notes)).toBe(`Blocked by ${ref} soon`)

    await notes.pressSequentially("!")
    await expect.poll(() => fieldText(notes)).toBe(`Blocked by ${ref}! soon`)
  })

  test("deleting the target leaves the reference behind as a broken one", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `Blocked by [[${targetId}]]`)
    await expect(cardRef(page, "Target card")).toBeVisible()

    await openCardMenu(page, "Target card")
    await page.getByRole("menuitem", { name: "Delete" }).click()

    // The id stays readable, but there's nothing left to click through to.
    // Scoped to the card: the sidebar's version link carries digits too.
    await expect(card(page, "Source card").getByText(targetId)).toBeVisible()
    await expect(card(page, "Source card").getByRole("link")).toHaveCount(0)
  })

  test("moving the target re-pills the reference with its new column", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `See [[${targetId}]]`)

    await cardTitled(page, "Target card").click()
    await expect(cardPanel(page)).toBeVisible()
    await cardPanel(page).getByRole("button", { name: "Card actions" }).click()
    await page.getByRole("menuitem", { name: "Move to" }).click()
    await page.getByRole("menuitem", { name: "In Progress" }).click()
    await closeCard(page)

    const ref = cardRef(page, "Target card")
    await expect(ref).toHaveAttribute("title", /In Progress/i)
    await expect(ref).not.toHaveAttribute("title", /To Do/i)
  })

  test("an id typed in the wrong case still resolves", async ({ page }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(
      page,
      "Source card",
      `Blocked by [[${targetId.toLowerCase()}]]`
    )

    await expect(cardRef(page, "Target card")).toBeVisible()
  })

  test("Enter and Space open the target from a focused reference", async ({
    page,
  }) => {
    const { targetId } = await boardWithTwoCards(page)
    await editCardBody(page, "Source card", `Blocked by [[${targetId}]]`)

    await cardRef(page, "Target card").focus()
    await page.keyboard.press("Enter")
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Target card")

    await page.keyboard.press("Escape")
    await expect(panelField(page, "Title")).toHaveCount(0)

    await cardRef(page, "Target card").focus()
    await page.keyboard.press(" ")
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Target card")
  })

  test("a target with no title is offered and renders as Untitled card", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Source card")
    // Left untitled on purpose — it still has an id, so it can still be linked.
    // Search reads title and body only, so the body is what finds it here.
    await addCard(page, "To Do")
    await editCardBody(page, "Untitled card", "needle")
    const targetId = await cardDisplayId(page, "needle")

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")
    await refMenuItem(page, "Untitled card", targetId).click()
    await closeCard(page)

    await expect(cardRef(page, "Untitled card")).toBeVisible()
  })

  test("cards the server hasn't numbered yet aren't offered", async ({
    page,
  }) => {
    // No sign-in, so nothing syncs and no card ever gets a display id.
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Target card")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Source card")

    await openCard(page, "Source card")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("[[")

    await expect(refMenuRows(page)).toHaveCount(0)
  })
})
