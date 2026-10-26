import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  addCardTags,
  boardTitle,
  card,
  cardTitled,
  closeCard,
  column,
  createBoard,
  editCardBody,
  fieldText,
  menu,
  openBoardMenu,
  openCardMenu,
  panelField,
  renameBoard,
  retitleCard,
} from "../helpers"

async function openTemplates(page: Page): Promise<void> {
  await page
    .locator('[data-slot="sidebar"]')
    .getByRole("button", { name: "Templates", exact: true })
    .click()
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible()
}

function fromTemplateButton(page: Page, columnName: string) {
  return column(page, columnName).getByRole("button", {
    name: "Add card from template",
  })
}

async function markCardAsTemplate(page: Page, title: string): Promise<void> {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "Add to templates" })
    .click()
  await expect(menu(page, "Card actions")).toBeHidden()
}

test.describe("templates", () => {
  test("with none yet, the page says how to add one", async ({ page }) => {
    await page.goto("/")
    await openTemplates(page)

    await expect(page.getByText("No templates yet.")).toBeVisible()
    await page
      .getByRole("button", { name: "How templates work" })
      .first()
      .click()
    await expect(
      page
        .getByRole("dialog")
        .getByText("Every card or board can be a template")
    ).toBeVisible()
  })

  test("a card template adds a copy to any column", async ({ page }) => {
    await createBoard(page)
    // No templates yet, so no picker next to +.
    await expect(fromTemplateButton(page, "To Do")).toHaveCount(0)

    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Standup")
    await editCardBody(page, "Standup", "- [ ] Yesterday\n- [ ] Today")
    await addCardTags(page, "Standup", ["daily"])
    await markCardAsTemplate(page, "Standup")

    await fromTemplateButton(page, "In Progress").click()
    await page.getByRole("menuitem", { name: "Standup" }).click()

    await page.waitForURL(/\/c\//)
    await expect
      .poll(() => fieldText(panelField(page, "Title")))
      .toBe("Standup")
    await closeCard(page)

    const copy = column(page, "In Progress").locator(
      cardTitled(page, "Standup")
    )
    await expect(copy).toHaveCount(1)
    await expect(copy).toContainText("0/2")
    await expect(copy).toContainText("daily")
    await expect(cardTitled(page, "Standup")).toHaveCount(2)

    // The copy is a plain card, not another template.
    await fromTemplateButton(page, "To Do").click()
    await expect(page.getByRole("menuitem", { name: "Standup" })).toHaveCount(1)
    await page.keyboard.press("Escape")
  })

  test("a card template is listed on the page and can be removed there", async ({
    page,
  }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Rituals")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Retro")
    await markCardAsTemplate(page, "Retro")

    await openTemplates(page)
    const row = page
      .getByRole("list", { name: "Card templates" })
      .getByRole("listitem")
      .filter({ hasText: "Retro" })
    await expect(row).toContainText("Rituals")

    await row.getByRole("button", { name: "Remove from templates" }).click()
    await expect(page.getByText("No templates yet.")).toBeVisible()

    // Only the mark goes; the card stays on its board.
    await page.getByRole("button", { name: "Rituals" }).click()
    await expect(boardTitle(page, "Rituals")).toBeVisible()
    await expect(card(page, "Retro")).toBeVisible()
    await expect(fromTemplateButton(page, "To Do")).toHaveCount(0)
  })

  test("the card menu toggles the mark both ways", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Toggle me")
    await markCardAsTemplate(page, "Toggle me")
    await expect(fromTemplateButton(page, "To Do")).toBeVisible()

    await openCardMenu(page, "Toggle me")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Remove from templates" })
      .click()
    await expect(fromTemplateButton(page, "To Do")).toHaveCount(0)
  })

  test("a board template makes new boards with its columns and cards", async ({
    page,
  }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Sprint")
    await addCard(page, "Done")
    await retitleCard(page, "Untitled card", "Demo prep")

    await openBoardMenu(page)
    await menu(page, "Board actions")
      .getByRole("menuitem", { name: "Add to templates" })
      .click()

    await openTemplates(page)
    const row = page
      .getByRole("list", { name: "Board templates" })
      .getByRole("listitem")
      .filter({ hasText: "Sprint" })
    const sprintUrl = page.url()
    await row.getByRole("button", { name: "New board" }).click()

    // Lands on the copy: a different board with the same name and contents.
    await page.waitForURL(/\/d\/board-/)
    expect(page.url()).not.toBe(sprintUrl)
    await expect(boardTitle(page, "Sprint")).toBeVisible()
    await expect(
      column(page, "Done").locator(card(page, "Demo prep"))
    ).toBeVisible()

    // The copy isn't a template itself.
    await openTemplates(page)
    await expect(
      page.getByRole("list", { name: "Board templates" }).getByRole("listitem")
    ).toHaveCount(1)
  })

  test("removing a board template keeps the board", async ({ page }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Keeper")
    await openBoardMenu(page)
    await menu(page, "Board actions")
      .getByRole("menuitem", { name: "Add to templates" })
      .click()

    await openTemplates(page)
    await page
      .getByRole("list", { name: "Board templates" })
      .getByRole("button", { name: "Remove from templates" })
      .click()
    await expect(page.getByText("No templates yet.")).toBeVisible()

    await page.getByRole("button", { name: "Keeper" }).click()
    await expect(boardTitle(page, "Keeper")).toBeVisible()
  })
})
