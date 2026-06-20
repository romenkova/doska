import { test, expect } from "@playwright/test"
import {
  addCard,
  authenticate,
  columnCardTitles,
  createBoard,
  remoteAddCard,
  remoteDeleteCard,
  remoteEditCard,
  retitleCard,
  signIn,
} from "./helpers"

/**
 * Multi-client sync, from the user's seat. The page is one client; the test
 * plays a *second* one (another device or teammate) by talking to the real
 * backend directly, then asserts the open board reflects the change — purely on
 * what's visible, never on ids or storage. The e2e bundle polls fast
 * (VITE_SYNC_INTERVAL_MS), so a change lands within a sub-second tick.
 *
 * Each test gets an isolated browser context and a unique board, so they never
 * see each other's data on the shared server.
 */
test.describe("sync across clients", () => {
  // Sync is gated: sign the page in through the UI, and authorize the simulated
  // second client (the `request` context) over the API.
  test.beforeEach(async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)
  })

  test("a card another client renames updates on the board", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan launch")

    // A teammate renames the same card; that this finds the card at all proves
    // our edit reached the server, and seeing it land proves we pull too.
    await remoteEditCard(request, boardId, "Plan launch", "Launch shipped")

    await expect(page.getByText("Launch shipped")).toBeVisible()
    await expect(page.getByText("Plan launch")).toHaveCount(0)
  })

  test("a card another client deletes disappears", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Keep me")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Delete me")

    await remoteDeleteCard(request, boardId, "Delete me")

    await expect(page.getByText("Delete me")).toHaveCount(0)
    await expect(page.getByText("Keep me")).toBeVisible()
  })

  test("a card another client adds appears in the right column", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)

    // The helper waits for our board's columns to reach the server first.
    await remoteAddCard(request, boardId, "To Do", "From a teammate")

    await expect(page.getByText("From a teammate")).toBeVisible()
    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toContain("From a teammate")

    // It's been stored locally, so it survives a reload.
    await page.reload()
    await expect(page.getByText("From a teammate")).toBeVisible()
  })
})
