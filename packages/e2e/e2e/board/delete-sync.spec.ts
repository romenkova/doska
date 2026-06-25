import { test, expect } from "@playwright/test"
import {
  addCard,
  authenticate,
  createBoard,
  deleteBoard,
  remoteAddCard,
  remoteDeleteDashboard,
  retitleCard,
  serverCard,
  signIn,
  waitForChange,
  waitForDashboardDeleted,
} from "../helpers"

/**
 * Deleting a board has to cascade to its contents across clients. A board is a
 * dashboard, and its columns/cards ride a per-board channel that goes quiet once
 * the board isn't open — so a peer that still has it open can keep adding cards
 * that nothing can ever reach again. These guard the two halves of the fix: the
 * server stamps such stragglers dead, and an open board that gets deleted out
 * from under you sends you home.
 *
 * The page is one client; the test plays a second one straight against the
 * backend. Each test gets an isolated context and a unique board.
 */
test.describe("board deletion cascade", () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)
  })

  test("a card added to a board after it's deleted is cascaded dead, not orphaned", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Real card")
    // Wait until the board's columns and a card have reached the server, so the
    // teammate below can resolve the column to push into.
    await waitForChange(request, boardId, "cards", "Real card")

    // I delete the board from my seat; wait for the tombstone to land.
    await deleteBoard(page)
    await waitForDashboardDeleted(request, boardId)

    // A teammate who still had it open adds a card after the deletion.
    await remoteAddCard(request, boardId, "To Do", "Ghost card")

    // The server must cascade it dead: stored, but a tombstone — never a live
    // orphan stranded under the deleted board.
    const ghost = await serverCard(request, boardId, "Ghost card")
    expect(ghost).not.toBeNull()
    expect(ghost?.deletedAt).not.toBeNull()
  })

  test("the open board sends you home when another client deletes it", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    // Make sure the board is fully established on the server before deleting it.
    await waitForChange(request, boardId, "columns", "To Do")

    await remoteDeleteDashboard(request, boardId)

    // The pulled tombstone drops the board from the list, so the open route is
    // gone — the app redirects off the deck and back to Home.
    await page.waitForURL((url) => !url.pathname.startsWith("/d/"))
    await expect(
      page.getByRole("button", { name: "Create a board" })
    ).toBeVisible()
  })
})
