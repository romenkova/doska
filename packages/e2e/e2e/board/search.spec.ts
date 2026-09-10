import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardDisplayId,
  createBoard,
  editCardBody,
  fieldText,
  panelField,
  retitleCard,
  setColumnDone,
  signIn,
} from "../helpers"

/**
 * The board's search overlay, driven the way a user drives it: the header
 * button or ⌘K, then typing. Type with `pressSequentially` — the list is
 * recomputed per keystroke, so this is what a real search feels like.
 */
function searchInput(page: Page) {
  return page.getByPlaceholder("Search cards")
}

function results(page: Page) {
  return page.getByRole("option")
}

async function openSearch(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Search cards" }).click()
  await expect(searchInput(page)).toBeVisible()
}

/** Adds a card to `column` and gives it a distinct title straight away. */
async function seedCard(
  page: Page,
  column: string,
  title: string
): Promise<void> {
  await addCard(page, column)
  await retitleCard(page, "Untitled card", title)
}

test.describe("card search", () => {
  test("the header button opens search and typing lists the match", async ({
    page,
  }) => {
    await createBoard(page)
    await seedCard(page, "To Do", "Ship the redesign")
    await seedCard(page, "To Do", "Water the plants")

    await openSearch(page)
    await searchInput(page).pressSequentially("redesign")

    await expect(results(page)).toHaveCount(1)
    await expect(results(page).first()).toContainText("Ship the redesign")
  })

  test("⌘K opens the same overlay", async ({ page }) => {
    await createBoard(page)
    await seedCard(page, "To Do", "Ship the redesign")

    // The shortcut binds ⌘K and Ctrl+K alike, so the spec can press one key
    // combination everywhere instead of branching on platform.
    await page.keyboard.press("Control+k")
    await expect(searchInput(page)).toBeVisible()

    await searchInput(page).pressSequentially("redesign")
    await expect(results(page).first()).toContainText("Ship the redesign")
  })

  test("finds a body-only match and shows a snippet of it", async ({
    page,
  }) => {
    await createBoard(page)
    await seedCard(page, "To Do", "Quarterly plan")
    await editCardBody(page, "Quarterly plan", "Numbers live in the spreadsheet")

    await openSearch(page)
    await searchInput(page).pressSequentially("spreadsheet")

    await expect(results(page)).toHaveCount(1)
    await expect(results(page).first()).toContainText("Quarterly plan")
    await expect(results(page).first()).toContainText(
      "Numbers live in the spreadsheet"
    )
  })

  test("a card id beats a card whose title merely holds the number", async ({
    page,
  }) => {
    // Card ids are stamped by the server on sync, so this one needs signing in.
    await signIn(page)
    await createBoard(page)
    await seedCard(page, "To Do", "Ship the redesign")

    const number = await cardDisplayId(page, "Ship the redesign")
    // Titled off the first card's real number, so the decoy genuinely competes
    // with it whatever number the server stamped.
    const decoy = `Sprint ${number} planning`
    await seedCard(page, "To Do", decoy)

    await openSearch(page)
    await searchInput(page).pressSequentially(number)
    await expect(results(page)).toHaveCount(2)
    await expect(results(page).first()).toContainText("Ship the redesign")
    await expect(results(page).nth(1)).toContainText(decoy)
  })

  test("ArrowDown then Enter opens the second result", async ({ page }) => {
    await createBoard(page)
    await seedCard(page, "To Do", "Launch checklist")
    await seedCard(page, "To Do", "Launch retro")

    await openSearch(page)
    await searchInput(page).pressSequentially("launch")
    await expect(results(page)).toHaveCount(2)

    // Read the title off the row rather than assuming which card ranks second:
    // the two score alike, so the tie-break is the board's own order. A row with
    // no body and no id renders its title on the first line, then its column.
    const second = (await results(page).nth(1).innerText()).split("\n")[0]

    await searchInput(page).press("ArrowDown")
    await searchInput(page).press("Enter")

    await expect(page).toHaveURL(/\/c\/card-/)
    await expect.poll(() => fieldText(panelField(page, "Title"))).toBe(second)
  })

  test("Escape closes search and leaves the board as it was", async ({
    page,
  }) => {
    await createBoard(page)
    await seedCard(page, "To Do", "Ship the redesign")

    await openSearch(page)
    await searchInput(page).pressSequentially("redesign")
    await expect(results(page)).toHaveCount(1)

    await searchInput(page).press("Escape")

    await expect(searchInput(page)).toHaveCount(0)
    // No open card: the panel's shell stays mounted after a card has been
    // opened once, so read it off the URL and the editor it would render.
    await expect(page).not.toHaveURL(/\/c\//)
    await expect(panelField(page, "Title")).toHaveCount(0)
    await expect(card(page, "Ship the redesign")).toBeVisible()
  })

  test("a card in the done column shows up like any other", async ({
    page,
  }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await seedCard(page, "Done", "Shipped the redesign")

    await openSearch(page)
    await searchInput(page).pressSequentially("redesign")

    await expect(results(page)).toHaveCount(1)
    await expect(results(page).first()).toContainText("Shipped the redesign")
  })
})
