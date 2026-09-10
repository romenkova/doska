import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  connectionBanner,
  createBoard,
  retitleCard,
  signIn,
  syncIndicator,
} from "../helpers"

// A 500 is a real server error (an aborted request would read as "offline"
// instead); enough consecutive failures flip the indicator to "Sync failed".
// The "Not syncing" notice that follows sits over the card panel's header, so
// it is dismissed here, before the card gets edited.
async function failSync(page: Page): Promise<void> {
  await page.route("**/api/rpc/**", (route) =>
    route.fulfill({ status: 500, body: "boom" })
  )
  await expect(connectionBanner(page)).toBeVisible({ timeout: 15_000 })
  await connectionBanner(page).getByRole("button", { name: "Dismiss" }).click()
  await expect(connectionBanner(page)).toHaveCount(0)
}

test.describe("sync failure", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test("a server error surfaces Sync failed", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Plan launch")
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")

    await failSync(page)
    await retitleCard(page, "Plan launch", "Launch shipped")

    await expect(syncIndicator(page)).toHaveAccessibleName("Sync failed", {
      timeout: 10_000,
    })
  })

  test("recovers once the backend comes back", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")

    await failSync(page)
    await retitleCard(page, "Untitled card", "Plan launch")
    await expect(syncIndicator(page)).toHaveAccessibleName("Sync failed", {
      timeout: 10_000,
    })

    await page.unroute("**/api/rpc/**")
    await page.keyboard.press("ControlOrMeta+s")

    await expect(syncIndicator(page)).toHaveAccessibleName("Synced", {
      timeout: 10_000,
    })
  })
})
