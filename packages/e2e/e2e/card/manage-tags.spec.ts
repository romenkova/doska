import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  addCardTags,
  cardTitled,
  createBoard,
  menu,
  openBoardMenu,
  retitleCard,
} from "../helpers"

async function boardWithTags(page: Page, cards: Record<string, string[]>) {
  await createBoard(page)
  for (const [title, tags] of Object.entries(cards)) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
    if (tags.length > 0) await addCardTags(page, title, tags)
  }
}

function tagChip(page: Page, cardTitle: string, tag: string) {
  return cardTitled(page, cardTitle).getByTitle(`Show cards tagged #${tag}`)
}

function manageTags(page: Page) {
  return page.getByRole("dialog", { name: "Manage tags" })
}

async function openManageTags(page: Page): Promise<void> {
  await openBoardMenu(page)
  await menu(page, "Board actions")
    .getByRole("menuitem", { name: "Manage tags" })
    .click()
  await expect(manageTags(page)).toBeVisible()
}

async function renameTag(page: Page, from: string, to: string) {
  const input = manageTags(page).getByRole("textbox", {
    name: `Rename #${from}`,
  })
  await input.fill(to)
  await input.press("Enter")
}

function iconColor(chip: Locator): Promise<string> {
  return chip
    .locator("svg")
    .evaluate(
      (element) =>
        element.ownerDocument.defaultView!.getComputedStyle(element).color
    )
}

test.describe("manage tags", () => {
  test("says so when the board has no tags", async ({ page }) => {
    await boardWithTags(page, { Alpha: [] })
    await openManageTags(page)

    await expect(
      manageTags(page).getByText("No cards on this board have tags yet.")
    ).toBeVisible()
  })

  test("renaming a tag renames it on every card", async ({ page }) => {
    await boardWithTags(page, { Alpha: ["bug"], Beta: ["bug", "ui"] })
    await openManageTags(page)

    await renameTag(page, "bug", "defect")
    await page.keyboard.press("Escape")

    await expect(tagChip(page, "Alpha", "defect")).toBeVisible()
    await expect(tagChip(page, "Beta", "defect")).toBeVisible()
    await expect(tagChip(page, "Beta", "bug")).toHaveCount(0)
  })

  test("renaming onto an existing tag merges the two", async ({ page }) => {
    await boardWithTags(page, { Alpha: ["bug", "ui"] })
    await openManageTags(page)

    await renameTag(page, "ui", "bug")

    await expect(
      manageTags(page).getByRole("textbox", { name: /^Rename #/ })
    ).toHaveCount(1)
    await page.keyboard.press("Escape")
    await expect(
      cardTitled(page, "Alpha").getByTitle(/^Show cards tagged #/)
    ).toHaveCount(1)
  })

  test("deleting a tag asks first, then takes it off every card", async ({
    page,
  }) => {
    await boardWithTags(page, { Alpha: ["bug", "ui"], Beta: ["bug"] })
    await openManageTags(page)

    await manageTags(page)
      .getByRole("button", { name: "Delete #bug" })
      .click()
    await page
      .getByRole("dialog", { name: "Delete #bug?" })
      .getByRole("button", { name: "Delete tag" })
      .click()
    await page.keyboard.press("Escape")

    await expect(tagChip(page, "Alpha", "bug")).toHaveCount(0)
    await expect(tagChip(page, "Beta", "bug")).toHaveCount(0)
    await expect(tagChip(page, "Alpha", "ui")).toBeVisible()
  })

  test("a tag color tints its chips", async ({ page }) => {
    await boardWithTags(page, { Alpha: ["bug", "ui"] })
    const plain = await iconColor(tagChip(page, "Alpha", "bug"))
    await openManageTags(page)

    await manageTags(page)
      .getByRole("button", { name: "Color for #bug" })
      .click()
    await page.getByRole("menuitem", { name: "Rose" }).click()
    await page.keyboard.press("Escape")

    await expect
      .poll(() => iconColor(tagChip(page, "Alpha", "bug")))
      .not.toBe(plain)
    expect(await iconColor(tagChip(page, "Alpha", "ui"))).toBe(plain)
  })

  test("a chip's context menu opens it too", async ({ page }) => {
    await boardWithTags(page, { Alpha: ["bug"] })

    await tagChip(page, "Alpha", "bug").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Manage tags…" }).click()

    await expect(manageTags(page)).toBeVisible()
  })
})
