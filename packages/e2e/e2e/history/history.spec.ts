import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  boardTitle,
  cardPanel,
  createBoard,
  fieldText,
  menu,
  openBoardInSidebar,
  openBoardMenu,
  openCard,
  openCardMenu,
  panelField,
  renameBoard,
  retitleCard,
  setCardPriority,
} from "../helpers"

/**
 * The history modals: a card's (board card menu and panel menu), a board's
 * (header menu) and the sidebar feed across every board. Signed out, every row
 * is "You".
 */

function historyDialog(page: Page) {
  return page.getByRole("dialog")
}

// Chips and the arrow break up a row's text, so match its words, not its spacing.
function sentence(text: string): RegExp {
  const words = text
    .split(" ")
    .map((word) => word.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
  return new RegExp(words.join("\\s*"))
}

function historyRow(page: Page, text: string) {
  return historyDialog(page)
    .getByRole("listitem")
    .filter({ hasText: sentence(text) })
}

async function openCardHistory(page: Page, title: string): Promise<void> {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "History" })
    .click()
  await expect(historyDialog(page)).toContainText("Card history")
}

async function openBoardHistory(page: Page): Promise<void> {
  await openBoardMenu(page)
  await menu(page, "Board actions")
    .getByRole("menuitem", { name: "History" })
    .click()
  await expect(historyDialog(page)).toContainText("Board history")
}

async function newBoard(page: Page, name: string): Promise<void> {
  await createBoard(page)
  await renameBoard(page, "Untitled board", name)
}

test.describe("history", () => {
  test("a card's history lists its changes, newest first", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan")
    await retitleCard(page, "Plan", "Ship")
    await setCardPriority(page, "Ship", "High")

    await openCardHistory(page, "Ship")

    await expect(historyDialog(page).getByRole("listitem")).toHaveText([
      sentence("You set priority of Ship to High"),
      sentence("You renamed card Plan Ship"),
      sentence("You created card Plan"),
    ])
  })

  test("an empty card has no history", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await openCardHistory(page, "Untitled card")

    await expect(historyDialog(page)).toContainText("No history yet")
  })

  test("the card panel's menu opens the card's history", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan")

    await openCard(page, "Plan")
    await cardPanel(page).getByRole("button", { name: "Card actions" }).click()
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "History" })
      .click()

    await expect(historyDialog(page)).toContainText("Card history")
    await expect(historyRow(page, "You created card Plan")).toBeVisible()
  })

  test("a board's history covers its cards, and a card name opens the card", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan")
    await openCardMenu(page, "Plan")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Move to", exact: true })
      .click()
    await page.getByRole("menuitem", { name: "In Progress" }).click()

    await openBoardHistory(page)

    await expect(
      historyRow(page, "You moved card Plan To Do In Progress")
    ).toBeVisible()
    await historyRow(page, "You created card Plan")
      .getByRole("button", { name: "Plan" })
      .click()

    await expect(historyDialog(page)).toHaveCount(0)
    await expect(cardPanel(page)).toBeVisible()
    await expect.poll(() => fieldText(panelField(page, "Title"))).toBe("Plan")
  })

  test("a card moved to another board shows on both boards", async ({
    page,
  }) => {
    await newBoard(page, "Alpha")
    await newBoard(page, "Beta")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Roamer")
    await openCardMenu(page, "Roamer")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Move to board" })
      .click()
    await page.getByRole("menuitem", { name: "Alpha" }).click()

    // The old board keeps a moved-out row whose name leads to the card's new home.
    await openBoardHistory(page)
    const movedOut = historyRow(
      page,
      "You moved card Roamer Beta / To Do Alpha / To Do"
    )
    await expect(movedOut).toBeVisible()
    await movedOut.getByRole("button", { name: "Roamer" }).click()

    await expect(historyDialog(page)).toHaveCount(0)
    await expect(boardTitle(page, "Alpha")).toBeVisible()
    await expect(cardPanel(page)).toBeVisible()

    // The copy on the new board carries the original's rows.
    await page.getByRole("button", { name: "Close card" }).click()
    await openCardHistory(page, "Roamer")
    await expect(historyDialog(page).getByRole("listitem")).toHaveText([
      sentence("You moved card Roamer Beta / To Do Alpha / To Do"),
      sentence("You created card Roamer"),
    ])
  })

  test("the sidebar feed spans every board, and a board name opens it", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "One")
    await newBoard(page, "Alpha")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Two")
    await openBoardInSidebar(page, "Untitled board")

    await page.getByRole("button", { name: "History" }).click()

    await expect(historyDialog(page)).toContainText("History")
    await expect(historyRow(page, "You created card One")).toBeVisible()
    await expect(historyRow(page, "You created card Two")).toBeVisible()
    await expect(
      historyRow(page, "You renamed board Untitled board Alpha")
    ).toBeVisible()

    // Both boards were created as "Untitled board"; Alpha is the newer row.
    await historyRow(page, "You created board Untitled board")
      .first()
      .getByRole("button", { name: "Untitled board" })
      .click()

    await expect(historyDialog(page)).toHaveCount(0)
    await expect(boardTitle(page, "Alpha")).toBeVisible()
  })
})
