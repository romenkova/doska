import { test, expect, type Locator } from "@playwright/test"
import { createAccount, PNG, sidebarAccount, signIn } from "../helpers"

function avatarImage(scope: Locator) {
  return scope.locator('[data-slot="avatar-image"]')
}

/**
 * Uploads go through the real `/api/files` route. Each test signs in as its own
 * account: an avatar on the shared `e2e` account would show up in every other spec.
 */
test.describe("avatar", { tag: "@container" }, () => {
  test("an uploaded avatar replaces the initials, and removing it brings them back", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "avatar")
    await signIn(page, account)

    const sidebar = page.locator('[data-slot="sidebar"]')
    await sidebarAccount(page, account.login).click()
    const dialog = page.getByRole("dialog")

    await dialog
      .locator('input[type="file"]')
      .setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG })
    await expect(avatarImage(dialog)).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(avatarImage(sidebar)).toBeVisible()

    // It lives on the account, not in this tab.
    await page.reload()
    await expect(avatarImage(sidebar)).toBeVisible()

    await sidebarAccount(page, account.login).click()
    await dialog.getByRole("button", { name: "Remove avatar" }).click()
    await expect(avatarImage(dialog)).toHaveCount(0)
    await expect(
      dialog.getByRole("button", { name: "Remove avatar" })
    ).toHaveCount(0)

    await page.keyboard.press("Escape")
    await expect(avatarImage(sidebar)).toHaveCount(0)
  })
})
