import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  menu,
  openBoardMenu,
  openCardMenu,
  openColumnMenu,
  openTrash,
  retitleCard,
  trashEntry,
} from "../helpers"

/**
 * Archiving takes a card off the board without deleting it. The board's ⋯ menu
 * opens the archived list, where each card can be restored or deleted.
 */

async function boardWithCards(page: Page, ...titles: string[]): Promise<void> {
  await createBoard(page)
  for (const title of titles) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
  }
}

async function archiveCard(page: Page, title: string): Promise<void> {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "Archive", exact: true })
    .click()
  await expect(card(page, title)).toHaveCount(0)
}

async function openArchive(page: Page): Promise<void> {
  await openBoardMenu(page)
  await menu(page, "Board actions")
    .getByRole("menuitem", { name: /^Archived cards/ })
    .click()
  await expect(cardPanel(page).getByText("Archived cards")).toBeVisible()
}

/** A row in the archived list. Not a board card, so `card()` never matches it. */
function archivedRow(page: Page, title: string) {
  return cardPanel(page).getByRole("listitem").filter({ hasText: title })
}

test.describe("archiving a card", () => {
  test("the card menu archives it and the toast puts it back", async ({
    page,
  }) => {
    await boardWithCards(page, "Old news")

    await archiveCard(page, "Old news")
    await expect(page.getByText("Old news archived")).toBeVisible()
    await page.getByRole("button", { name: "Undo" }).click()

    await expect(card(page, "Old news")).toBeVisible()
  })

  test("an archived card stays off the board after a reload", async ({
    page,
  }) => {
    await boardWithCards(page, "Shelved", "Still here")

    await archiveCard(page, "Shelved")
    await page.reload()

    await expect(card(page, "Still here")).toBeVisible()
    await expect(card(page, "Shelved")).toHaveCount(0)
  })

  test("the archived list holds only archived cards, with a count in the menu", async ({
    page,
  }) => {
    await boardWithCards(page, "Shelved", "Still here")
    await archiveCard(page, "Shelved")

    await openBoardMenu(page)
    await expect(
      menu(page, "Board actions").getByRole("menuitem", {
        name: /^Archived cards/,
      })
    ).toContainText("1")
    await page.keyboard.press("Escape")

    await openArchive(page)
    await expect(archivedRow(page, "Shelved")).toBeVisible()
    await expect(archivedRow(page, "Still here")).toHaveCount(0)
  })

  test("restoring from the list puts the card back on the board", async ({
    page,
  }) => {
    await boardWithCards(page, "Bring back")
    await archiveCard(page, "Bring back")

    await openArchive(page)
    await archivedRow(page, "Bring back")
      .getByRole("button", { name: "Restore" })
      .click()

    await expect(card(page, "Bring back")).toBeVisible()
    await page.reload()
    await expect(card(page, "Bring back")).toBeVisible()
  })

  test("deleting from the list sends the card to the trash", async ({
    page,
  }) => {
    await boardWithCards(page, "Done with it")
    await archiveCard(page, "Done with it")

    await openArchive(page)
    await archivedRow(page, "Done with it")
      .getByRole("button", { name: "Delete" })
      .click()
    await expect(archivedRow(page, "Done with it")).toHaveCount(0)

    await openTrash(page)
    await expect(trashEntry(page, "Done with it")).toBeVisible()
  })

  test("an archived card opens with a banner that restores it", async ({
    page,
  }) => {
    await boardWithCards(page, "Peek inside")
    await archiveCard(page, "Peek inside")

    await openArchive(page)
    await archivedRow(page, "Peek inside").getByText("Peek inside").click()

    const banner = cardPanel(page)
      .getByRole("status")
      .filter({ hasText: "This card is archived" })
    await expect(banner).toBeVisible()
    await banner.getByRole("button", { name: "Restore" }).click()

    await expect(card(page, "Peek inside")).toBeVisible()
  })

  test("a column's archive-all takes every card in it", async ({ page }) => {
    await boardWithCards(page, "First", "Second")

    await openColumnMenu(page, "To Do")
    await page.getByRole("menuitem", { name: "Archive all cards" }).click()

    await expect(page.getByText("2 cards archived")).toBeVisible()
    await expect(card(page, "First")).toHaveCount(0)
    await expect(card(page, "Second")).toHaveCount(0)

    await openArchive(page)
    await expect(archivedRow(page, "First")).toBeVisible()
    await expect(archivedRow(page, "Second")).toBeVisible()
  })

  test("search still finds an archived card, marked as archived", async ({
    page,
  }) => {
    await boardWithCards(page, "Hidden gem")
    await archiveCard(page, "Hidden gem")

    await page.getByRole("button", { name: "Search cards" }).click()
    await page.getByPlaceholder("Search cards").fill("Hidden gem")

    const row = page.getByRole("option").filter({ hasText: "Hidden gem" })
    await expect(row).toContainText("Archived")
  })
})
