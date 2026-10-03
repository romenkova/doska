import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  createAccount,
  createBoard,
  menu,
  openCardMenu,
  openShare,
  retitleCard,
  signIn,
  waitForChange,
  TEST_CREDENTIALS,
} from "../helpers"

async function tagUser(page: Page, title: string, login: string) {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "Users", exact: true })
    .click()
  await menu(page, "Users")
    .getByRole("menuitem", { name: `@${login}`, exact: true })
    .click()
  await page.keyboard.press("Escape")
  await page.keyboard.press("Escape")
  await expect(menu(page, "Card actions")).toBeHidden()
}

function filterAvatar(page: Page, label: string) {
  return page.getByRole("button", { name: `Filter by ${label}`, exact: true })
}

test.describe("user filter", () => {
  test("clicking a member's avatar shows only their cards, clicking again clears it", async ({
    page,
    request,
    browserName,
  }) => {
    const member = await createAccount(request, "filter")
    const mine = `Mine (${browserName} ${Date.now()})`
    const theirs = `Theirs (${browserName} ${Date.now()})`

    await signIn(page)
    const boardId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", mine)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", theirs)
    // Sharing is a server write, so the board has to be there first.
    await waitForChange(request, boardId, "cards", theirs)

    await openShare(page)
    const search = page.getByPlaceholder("Search accounts")
    if (await search.count()) await search.fill(member.login)
    const row = page
      .getByRole("listitem")
      .filter({ has: page.getByText(member.login, { exact: true }) })
    await row.getByRole("button", { name: "Add", exact: true }).click()
    await expect(row.getByRole("button", { name: "Remove" })).toBeVisible()
    await page.keyboard.press("Escape")

    await tagUser(page, mine, TEST_CREDENTIALS.login)
    await tagUser(page, theirs, member.login)

    await filterAvatar(page, member.login).click()
    await expect(card(page, theirs)).toBeVisible()
    await expect(card(page, mine)).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: `Clear @${member.login} filter` })
    ).toBeVisible()

    await filterAvatar(page, "You").click()
    await expect(card(page, mine)).toBeVisible()
    await expect(card(page, theirs)).toBeVisible()

    await filterAvatar(page, member.login).click()
    await filterAvatar(page, "You").click()
    await expect(card(page, mine)).toBeVisible()
    await expect(card(page, theirs)).toBeVisible()
    await expect(
      page.getByRole("button", { name: `Clear @${member.login} filter` })
    ).toHaveCount(0)
  })
})
