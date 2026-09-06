import { test, expect, type APIRequestContext, type Page } from "@playwright/test"
import {
  addCard,
  authenticate,
  card,
  createBoard,
  openBoardInSidebar,
  openShare,
  remoteUnshare,
  renameBoard,
  retitleCard,
  signIn,
  signOut,
  waitForChange,
  TEST_CREDENTIALS,
} from "../helpers"

/**
 * Sharing a board with another account, from the owner's side and the member's.
 * One device, two accounts in turn: signing out wipes it, so what the member
 * sees afterwards arrived over sync rather than being left behind.
 *
 * Every run makes its own account — accounts are deactivated, never deleted, so
 * a fixed login would collide with earlier runs.
 */

function uniqueLogin(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

/** Creates an account from the owner's accounts modal, and closes it again. */
async function createAccount(
  page: Page,
  login: string,
  password: string
): Promise<void> {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("button", { name: "Accounts" }).click()
  await page.getByPlaceholder("Login").fill(login)
  await page.getByPlaceholder("Password").fill(password)
  await page.getByRole("button", { name: "Add", exact: true }).click()
  await expect(page.getByText(login, { exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("heading", { name: "Accounts" })).toHaveCount(0)
}

/** The sidebar entry for `name`, marker and all. */
function sidebarBoard(page: Page, name: string) {
  return page.getByRole("button", { name, exact: false })
}

interface Shared {
  boardId: string
  board: string
  cardTitle: string
  account: { login: string; password: string }
}

/**
 * The owner signs in, makes an account, makes a board with a card on it, waits
 * for the board to reach the server (sharing is a server write, so an unsynced
 * board has nothing to share), and shares it through the Share dialog.
 */
async function shareWithNewAccount(
  page: Page,
  request: APIRequestContext,
  browserName: string
): Promise<Shared> {
  const account = { login: uniqueLogin(browserName), password: "member-pass" }
  const board = `Shared roadmap (${browserName} ${Date.now()})`
  const cardTitle = `Shared card (${browserName} ${Date.now()})`

  await signIn(page)
  await authenticate(request)
  await createAccount(page, account.login, account.password)

  const boardId = await createBoard(page)
  await renameBoard(page, "Untitled board", board)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", cardTitle)
  await waitForChange(request, boardId, "cards", cardTitle)

  await openShare(page)
  // Every run of every spec leaves another account behind, so by now the picker
  // is long enough to have grown its filter.
  const search = page.getByPlaceholder("Search accounts")
  if (await search.count()) await search.fill(account.login)

  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByText(account.login, { exact: true }) })
  await row.getByRole("button", { name: "Add", exact: true }).click()
  // The roster is whatever the server says it is, so the account turning up
  // there — with the owner's Remove control — is the write having landed.
  await expect(row.getByRole("button", { name: "Remove" })).toBeVisible()
  await page.keyboard.press("Escape")

  return { boardId, board, cardTitle, account }
}

test.describe("sharing a board", () => {
  test("a shared board arrives with its cards, and goes when it is taken back", async ({
    page,
    request,
    browserName,
  }) => {
    const shared = await shareWithNewAccount(page, request, browserName)

    // The owner can tell at a glance that this board is no longer private.
    await expect(
      sidebarBoard(page, shared.board).getByRole("img", { name: "Shared" })
    ).toBeVisible()

    await signOut(page)
    await signIn(page, shared.account)

    await expect(sidebarBoard(page, shared.board)).toBeVisible({
      timeout: 15_000,
    })
    await openBoardInSidebar(page, shared.board)
    await expect(card(page, shared.cardTitle)).toBeVisible({ timeout: 15_000 })

    // The owner revokes from their own device, and this one has to notice.
    await remoteUnshare(request, shared.boardId, shared.account.login)

    await expect(sidebarBoard(page, shared.board)).toHaveCount(0, {
      timeout: 15_000,
    })
  })

  test("a member sees the roster read-only and can leave", async ({
    page,
    request,
    browserName,
  }) => {
    const shared = await shareWithNewAccount(page, request, browserName)

    await signOut(page)
    await signIn(page, shared.account)
    await expect(sidebarBoard(page, shared.board)).toBeVisible({
      timeout: 15_000,
    })
    await openBoardInSidebar(page, shared.board)

    await openShare(page)
    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByText(TEST_CREDENTIALS.login, { exact: true })
    ).toBeVisible()
    await expect(dialog.getByText("Add someone")).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: "Remove" })).toHaveCount(0)

    await dialog.getByRole("button", { name: "Leave", exact: true }).click()
    await dialog.getByRole("button", { name: "Leave board" }).click()

    // An open modal hides the sidebar from the a11y tree, so a board is
    // trivially "gone" while one is up: get back to the app before asserting.
    await page.keyboard.press("Escape")
    await expect(page.getByRole("button", { name: "New board" })).toBeVisible()
    await expect(sidebarBoard(page, shared.board)).toHaveCount(0, {
      timeout: 15_000,
    })
  })
})
