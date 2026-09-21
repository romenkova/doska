import { test, expect } from "@playwright/test"

/**
 * The settings modal's only section: the version it's running and the manual
 * update check. On the web build there is never a Tauri bundle to install, so
 * the check settles on "up to date".
 */
test.describe("settings updates", () => {
  test("shows the running version and reports up to date", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Settings" }).click()

    const modal = page.getByRole("dialog")
    await expect(modal.getByText(/^Doska version:/)).toBeVisible()
    await modal.getByRole("button", { name: "Check for updates" }).click()

    await expect(modal.getByText("You're up to date.")).toBeVisible({
      timeout: 15_000,
    })
  })
})
