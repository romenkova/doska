import { test, expect } from "@playwright/test"

// The toggle's label tracks the current theme, not the one it switches to.
test.describe("theme toggle", () => {
  test("switches the theme and persists it across reload", async ({
    page,
  }) => {
    await page.goto("/")

    const toggle = page.getByRole("button", { name: "Dark theme" })
    await expect(toggle).toBeVisible()
    await expect(page.locator("html")).toHaveClass("dark")

    await toggle.click()
    await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible()
    await expect(page.locator("html")).toHaveClass("light")
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("theme")))
      .toBe("light")

    await page.reload()
    await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible()
    await expect(page.locator("html")).toHaveClass("light")
  })
})
