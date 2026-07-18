import { test, expect } from "@playwright/test"

// Its only section (DesktopUpdatesSection) renders nothing on web, so there's just open/close to cover.
test.describe("settings modal", () => {
  test("opens from the sidebar and closes on Escape", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: "Settings" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Settings")).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
  })
})
