import { test, expect } from "@playwright/test"
import { TEST_CREDENTIALS, signIn, signOut } from "../helpers"

/**
 * The sign-in flow gates sync. These drive it from the sidebar account control
 * exactly as a user would: open the dialog, succeed or fail, and sign back out.
 */
test.describe("authentication", () => {
  test("wrong credentials show an error and keep the dialog open", async ({
    page,
  }) => {
    await page.goto("/")
    await page
      .getByRole("button", { name: "Sign in to sync", exact: true })
      .click()

    await page.getByPlaceholder("Login").fill("e2e")
    await page.getByPlaceholder("Password").fill("wrong-password")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    // The error surfaces and the dialog stays open for another try.
    await expect(page.getByText("Invalid credentials.")).toBeVisible()
    await expect(page.getByPlaceholder("Login")).toBeVisible()
  })

  test("signing in then out returns to the signed-out state", async ({
    page,
  }) => {
    await signIn(page)

    // Signed in: the account shows the login and offers a sign-out control.
    await expect(page.getByText(TEST_CREDENTIALS.login)).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()

    await signOut(page)

    // Back to signed-out: the sign-in control is offered again.
    await expect(
      page.getByRole("button", { name: "Sign in to sync", exact: true })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0)
  })
})
