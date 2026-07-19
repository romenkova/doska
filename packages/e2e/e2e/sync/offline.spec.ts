import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  authenticate,
  card,
  createBoard,
  openCard,
  remoteAddCard,
  signIn,
  syncIndicator,
} from "../helpers"

// The offline banner overlays the panel's Save button, so activate Save by
// keyboard rather than clicking through the banner.
async function retitleCardOffline(
  page: Page,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  await openCard(page, fromTitle)
  await page.getByPlaceholder("Title").fill(toTitle)
  await page.getByRole("button", { name: "Save" }).focus()
  await page.keyboard.press("Enter")
  await page.waitForURL((url) => !url.pathname.includes("/c/"))
}

/**
 * Offline behavior from the user's seat. `setOffline` is scoped to this test's
 * browser context, so it never touches other workers or the shared server.
 * Sign-in needs the network, so every test reaches a synced state first.
 */
test.describe("offline editing", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test("going offline shows Offline, then recovers", async ({ page }) => {
    await createBoard(page)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")

    await page.context().setOffline(true)
    await expect(syncIndicator(page)).toHaveAccessibleName("Offline", {
      timeout: 10_000,
    })

    await page.context().setOffline(false)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced", {
      timeout: 15_000,
    })
  })

  test("an edit made offline shows immediately, then syncs on reconnect", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")

    await page.context().setOffline(true)
    await retitleCardOffline(page, "Untitled card", "Plan launch")
    await expect(card(page, "Plan launch")).toBeVisible()

    await page.context().setOffline(false)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced", {
      timeout: 10_000,
    })
  })

  test("a remote change made while offline pulls in once back online", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    await authenticate(request)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")

    await page.context().setOffline(true)
    await remoteAddCard(request, boardId, "To Do", "From a teammate")
    await expect(card(page, "From a teammate")).toHaveCount(0)

    await page.context().setOffline(false)
    await expect(card(page, "From a teammate")).toBeVisible()
  })
})
