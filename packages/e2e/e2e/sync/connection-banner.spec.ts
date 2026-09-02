import { test, expect } from "@playwright/test"
import { createBoard, sidebarAccount, signIn, syncIndicator } from "../helpers"

/**
 * The app-wide "sync is down" notice, mounted outside the board so a dropped
 * connection is visible even where the board's sync pill isn't.
 */
test.describe("connection banner", () => {
  const banner = (page: import("@playwright/test").Page) =>
    page.getByRole("status").filter({ hasText: "Not syncing" })

  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")
  })

  test("appears when the connection drops and clears on recovery", async ({
    page,
  }) => {
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
    await expect(
      banner(page).getByText("Data is saved on this device.")
    ).toBeVisible()
    await expect(
      banner(page).getByRole("button", { name: "Retry" })
    ).toBeVisible()

    await page.context().setOffline(false)
    await expect(banner(page)).toHaveCount(0, { timeout: 15_000 })
  })

  test("can be dismissed, and returns on the next drop", async ({ page }) => {
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })

    await banner(page).getByRole("button", { name: "Dismiss" }).click()
    await expect(banner(page)).toHaveCount(0)

    // Still offline, but dismissed — the notice stays down for this drop.
    await expect(syncIndicator(page)).toHaveAccessibleName("Offline")
    await expect(banner(page)).toHaveCount(0)

    // A fresh drop is a fresh notice.
    await page.context().setOffline(false)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced", {
      timeout: 15_000,
    })
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
  })

  test("shows on Home, where there is no sync pill to fall back on", async ({
    page,
  }) => {
    // The case the banner exists for: Home has no sync pill, so this notice is
    // the only sign sync is down. Wait for the session check to land before
    // dropping the connection — a load with no session yet reads as signed out,
    // which is local-only, which has nothing to report.
    await page.goto("/")
    await expect(sidebarAccount(page)).toBeVisible()
    await page.context().setOffline(true)

    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
    // Still signed in, too: the sidebar keeps the account it knows.
    await expect(sidebarAccount(page)).toBeVisible()
  })
})
