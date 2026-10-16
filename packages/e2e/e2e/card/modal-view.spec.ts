import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  addCardTags,
  card,
  cardPanel,
  columnCardTitles,
  createBoard,
  editCardBody,
  menu,
  retitleCard,
} from "../helpers"

function cardModal(page: Page) {
  return page.getByRole("dialog", { name: "Card" })
}

function filterPill(page: Page, tag: string) {
  return page.getByRole("button", { name: `Clear #${tag} filter` })
}

// Set up with the panel helpers, then switch: the setting applies from the next open.
async function boardWithTags(page: Page, cards: Record<string, string[]>) {
  await createBoard(page)
  for (const [title, tags] of Object.entries(cards)) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
    if (tags.length > 0) await addCardTags(page, title, tags)
  }
}

async function pickCardView(page: Page, view: "Panel" | "Modal") {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("button", { name: view, exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
}

async function openInModal(page: Page, title: string) {
  await card(page, title).click()
  await expect(cardModal(page)).toBeVisible()
}

async function expectModalClosed(page: Page) {
  await page.waitForURL((url) => !url.pathname.includes("/c/"))
  await expect(cardModal(page)).toHaveCount(0)
}

test.describe("card modal view", () => {
  test("the settings switch opens cards in a modal, and back in the panel", async ({
    page,
  }) => {
    await boardWithTags(page, { Alpha: [] })

    await pickCardView(page, "Modal")

    await openInModal(page, "Alpha")
    await expect(cardPanel(page)).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expectModalClosed(page)

    await pickCardView(page, "Panel")

    await card(page, "Alpha").click()
    await expect(cardPanel(page)).toBeVisible()
    await expect(cardModal(page)).toHaveCount(0)
  })

  test("the choice survives a reload", async ({ page }) => {
    await boardWithTags(page, { Alpha: [] })
    await pickCardView(page, "Modal")

    await page.reload()

    await openInModal(page, "Alpha")
  })

  test("Escape and the close button both close it", async ({ page }) => {
    await boardWithTags(page, { Alpha: [] })
    await pickCardView(page, "Modal")

    await openInModal(page, "Alpha")
    await page.keyboard.press("Escape")
    await expectModalClosed(page)

    await openInModal(page, "Alpha")
    await cardModal(page).getByRole("button", { name: "Close card" }).click()
    await expectModalClosed(page)
  })

  // An empty card opens in the editor with the title focused, so this needs a body to open in preview.
  test("a click-open focuses the modal, not its close button", async ({
    page,
  }) => {
    await boardWithTags(page, { Alpha: [] })
    await editCardBody(page, "Alpha", "Some notes")
    await pickCardView(page, "Modal")

    await openInModal(page, "Alpha")

    await expect(cardModal(page)).toBeFocused()
  })

  test("clicking a card's tag closes the modal and filters the board", async ({
    page,
  }) => {
    await boardWithTags(page, { Alpha: ["urgent"], Beta: [] })
    await pickCardView(page, "Modal")

    await openInModal(page, "Alpha")
    await cardModal(page).getByTitle("Show cards tagged #urgent").click()

    await expectModalClosed(page)
    await expect(filterPill(page, "urgent")).toBeVisible()
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual(["Alpha"])
  })

  test("Reveal on board closes the modal", async ({ page }) => {
    await boardWithTags(page, { Alpha: [] })
    await pickCardView(page, "Modal")

    await openInModal(page, "Alpha")
    await cardModal(page).getByRole("button", { name: "Card actions" }).click()
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Reveal on board" })
      .click()

    await expectModalClosed(page)
  })

  test("in the panel, a tag filters without closing the card", async ({
    page,
  }) => {
    await boardWithTags(page, { Alpha: ["urgent"], Beta: [] })

    await card(page, "Alpha").click()
    await cardPanel(page).getByTitle("Show cards tagged #urgent").click()

    await expect(filterPill(page, "urgent")).toBeVisible()
    await expect(cardPanel(page)).toBeVisible()
  })
})
