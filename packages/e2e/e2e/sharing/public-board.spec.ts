import {
  test,
  expect,
  type APIRequestContext,
  type Browser,
  type Page,
} from "@playwright/test"
import {
  addCard,
  authenticate,
  cardDisplayId,
  createBoard,
  editCardBody,
  openShare,
  renameBoard,
  retitleCard,
  signIn,
  waitForChange,
} from "../helpers"

/**
 * Publishing a board to a link anyone can open. The visitor runs in a second
 * browser context that never signs in — that is the whole feature, so the test
 * would prove nothing sharing the owner's session.
 */

interface Published {
  url: string
  board: string
  cardTitle: string
}

/** The visitor's board card, matched on its title. Public cards are not
 * draggable, so the `card` helper's locator finds nothing here. */
function publicCard(page: Page, title: string) {
  return page.locator('[data-slot="card-title"]', { hasText: title })
}

/**
 * The owner signs in, makes a board with one card, waits for it to reach the
 * server (publishing is a server write, so an unsynced board has nothing to
 * publish), and creates the link from the Share dialog.
 */
async function publish(
  page: Page,
  request: APIRequestContext,
  browserName: string
): Promise<Published> {
  const board = `Public roadmap (${browserName} ${Date.now()})`
  const cardTitle = `Public card (${browserName} ${Date.now()})`

  await signIn(page)
  await authenticate(request)

  const boardId = await createBoard(page)
  await renameBoard(page, "Untitled board", board)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", cardTitle)
  await waitForChange(request, boardId, "cards", cardTitle)

  return { url: await createLink(page), board, cardTitle }
}

async function createLink(page: Page): Promise<string> {
  await openShare(page)
  await page.getByRole("button", { name: "Create link" }).click()

  const link = page.getByRole("textbox", { name: "Public link" })
  await expect(link).toBeVisible()
  const url = await link.inputValue()
  expect(url).toContain("/p/")
  return url
}

/** A browser that has never seen this app: no session, no local database. */
async function visitorPage(browser: Browser, url: string): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  return page
}

test.describe("a published board", () => {
  test("opens for a visitor with no account, and offers nothing to edit", async ({
    page,
    request,
    browser,
    browserName,
  }) => {
    const published = await publish(page, request, browserName)
    const visitor = await visitorPage(browser, published.url)

    await expect(visitor.getByText(published.board)).toBeVisible()
    await expect(publicCard(visitor, published.cardTitle)).toBeVisible()
    // innerText applies CSS text-transform, so this catches an uppercased title.
    expect(await visitor.getByText("To Do", { exact: true }).innerText()).toBe(
      "To Do"
    )

    // Never sent to the sign-in screen, and given none of the app around the
    // board: no sidebar, no board menu, nothing that would add to it.
    await expect(visitor.getByPlaceholder("Login")).toHaveCount(0)
    await expect(
      visitor.getByRole("button", { name: "Board actions" })
    ).toHaveCount(0)
    await expect(
      visitor.getByRole("button", { name: /^Add card to / })
    ).toHaveCount(0)

    // A card still opens — read-only, so the panel has no editing controls.
    await publicCard(visitor, published.cardTitle).click()
    await expect(
      visitor.getByRole("button", { name: "Close card" })
    ).toBeVisible()
    await expect(visitor.getByRole("button", { name: "Edit" })).toHaveCount(0)
    await expect(
      visitor.getByRole("button", { name: "Card actions" })
    ).toHaveCount(0)

    await visitor.context().close()
  })

  test("resolves card links by number and by title", async ({
    page,
    request,
    browser,
  }) => {
    await signIn(page)
    await authenticate(request)
    const boardId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Target card")
    const targetId = await cardDisplayId(page, "Target card")

    // The body goes in before the title, so the title reaching the server
    // means the body has too.
    await addCard(page, "To Do")
    await editCardBody(
      page,
      "Untitled card",
      `By number [[${targetId}]], by title [[target CARD]]`
    )
    await retitleCard(page, "Untitled card", "Source card")
    await waitForChange(request, boardId, "cards", "Source card")

    const visitor = await visitorPage(browser, await createLink(page))
    await publicCard(visitor, "Source card").click()

    const panel = visitor.getByRole("region", { name: "Card" })
    await expect(
      panel.getByRole("link").filter({ hasText: "Target card" })
    ).toHaveCount(2)
    await expect(panel.getByTitle("No such card")).toHaveCount(0)

    await visitor.context().close()
  })

  test("stops opening once the owner turns the link off", async ({
    page,
    request,
    browser,
    browserName,
  }) => {
    const published = await publish(page, request, browserName)
    const visitor = await visitorPage(browser, published.url)
    await expect(publicCard(visitor, published.cardTitle)).toBeVisible()

    await page.getByRole("button", { name: "Turn off" }).click()
    await expect(
      page.getByRole("button", { name: "Create link" })
    ).toBeVisible()

    await visitor.reload()
    await expect(visitor.getByText(/no longer|not shared/i)).toBeVisible()
    await expect(publicCard(visitor, published.cardTitle)).toHaveCount(0)

    await visitor.context().close()
  })
})
