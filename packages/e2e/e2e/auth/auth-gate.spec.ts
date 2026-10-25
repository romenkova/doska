import { test, expect, type Page } from "@playwright/test"
import { sidebarAccount, TEST_CREDENTIALS } from "../helpers"

/** Stands in for the server's ALWAYS_AUTH setting. */
async function serverRequiresAuth(page: Page, authRequired: boolean) {
  await page.route("**/api/sso", (route) =>
    route.fulfill({ json: { providers: [], authRequired } })
  )
}

function sidebar(page: Page) {
  return page.locator('[data-slot="sidebar"]')
}

test.describe("auth gate", () => {
  test("a server that requires sign-in shows only the sign-in page", async ({
    page,
  }) => {
    await serverRequiresAuth(page, true)
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
    await expect(sidebar(page)).toHaveCount(0)

    await page.getByPlaceholder("Login").fill(TEST_CREDENTIALS.login)
    await page.getByPlaceholder("Password").fill(TEST_CREDENTIALS.password)
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    await expect(sidebarAccount(page)).toBeVisible()
  })

  test("with ALWAYS_AUTH=false the app works signed out", async ({ page }) => {
    await serverRequiresAuth(page, false)
    await page.goto("/")

    await expect(
      sidebar(page).getByRole("button", {
        name: "Sign in to sync",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create a board" })
    ).toBeVisible()
  })
})
