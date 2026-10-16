import { test, expect, type Page } from "@playwright/test"
import { seenModals } from "../helpers/seen-modals"

function toast(page: Page) {
  return page.getByText("Doska was updated")
}

/** Once the session check resolves, the toast has been decided either way. */
function sidebarSignIn(page: Page) {
  return page
    .locator('[data-slot="sidebar"]')
    .getByRole("button", { name: "Sign in to sync", exact: true })
}

/** Someone past onboarding who hasn't seen this version's slides yet. */
test.describe("what's new", () => {
  test.use({
    storageState: async ({ baseURL }, use) =>
      use(seenModals(baseURL!, { whatsNew: false })),
  })

  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(sidebarSignIn(page)).toBeVisible()
  })

  test("the toast opens the slides, and doesn't come back", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Doska" })).toHaveCount(0)
    await page.getByRole("button", { name: "What's new" }).click()
    await expect(toast(page)).toBeHidden()

    const modal = page.getByRole("dialog")
    for (const name of [
      "History",
      "Cards can open in a modal",
      "Formatting shortcuts",
    ]) {
      await expect(modal.getByRole("heading", { name })).toBeVisible()
      await modal.getByRole("button", { name: "Next", exact: true }).click()
    }
    await expect(
      modal.getByRole("heading", { name: "Got feedback?" })
    ).toBeVisible()
    await modal.getByRole("button", { name: "Done", exact: true }).click()
    await expect(modal).toBeHidden()

    await page.reload()
    await expect(sidebarSignIn(page)).toBeVisible()
    await expect(toast(page)).toHaveCount(0)
  })

  test("dismissing the toast doesn't open the slides and sticks", async ({
    page,
  }) => {
    await expect(toast(page)).toBeVisible()
    await page.getByRole("button", { name: "Dismiss" }).click()
    await expect(toast(page)).toBeHidden()
    await expect(page.getByRole("dialog")).toHaveCount(0)

    await page.reload()
    await expect(sidebarSignIn(page)).toBeVisible()
    await expect(toast(page)).toHaveCount(0)
  })
})
