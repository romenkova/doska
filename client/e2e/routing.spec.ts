import { test, expect } from "@playwright/test"

test.describe("routing", () => {
  test("root URL shows the Home landing, not a deck", async ({ page }) => {
    await page.goto("/")

    // Seeds exist, so Home prompts to pick a board.
    await expect(
      page.getByText("Pick a board to get started")
    ).toBeVisible()
    expect(new URL(page.url()).pathname).toBe("/")
  })

  test("a stale deck link redirects to the root", async ({ page }) => {
    await page.goto("/d/does-not-exist")

    // App resolves the dead link back to root, which shows Home.
    await page.waitForURL(/\/$/)
    await expect(
      page.getByText("Pick a board to get started")
    ).toBeVisible()
  })
})
