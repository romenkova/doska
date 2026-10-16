import { test, expect, type Page } from "@playwright/test"
import { TEST_CREDENTIALS, sidebarAccount } from "../helpers"

function deck(page: Page) {
  return page.getByRole("dialog")
}

function slide(page: Page, name: string) {
  return deck(page).getByRole("heading", { name, exact: true })
}

async function next(page: Page) {
  await deck(page).getByRole("button", { name: "Next", exact: true }).click()
}

async function expectAppSettled(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Pick a board to get started" })
  ).toBeVisible()
}

/** A fresh browser context is a first visit: signed out, only the Welcome board. */
test.describe("onboarding", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("walks a first visit through every slide, then stays closed", async ({
    page,
  }) => {
    await page.goto("/")

    for (const name of [
      "Doska",
      "Cards",
      "Opening cards",
      "Organizing",
      "Members",
      "Sign in to your server",
    ]) {
      await expect(slide(page, name)).toBeVisible()
      await next(page)
    }
    await expect(slide(page, "That's it")).toBeVisible()
    await deck(page).getByRole("button", { name: "Done", exact: true }).click()
    await expect(deck(page)).toBeHidden()

    await page.reload()
    await expectAppSettled(page)
    await expect(deck(page)).toHaveCount(0)
    // Finishing onboarding counts as having seen the current what's new
    await expect(page.getByText("Doska was updated")).toHaveCount(0)
  })

  test("Escape closes it for good", async ({ page }) => {
    await page.goto("/")
    await expect(slide(page, "Doska")).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(deck(page)).toBeHidden()

    await page.reload()
    await expectAppSettled(page)
    await expect(deck(page)).toHaveCount(0)
  })

  test("picking a card view advances and remembers the choice", async ({
    page,
  }) => {
    await page.goto("/")
    await next(page)
    await next(page)
    await expect(slide(page, "Opening cards")).toBeVisible()

    await deck(page)
      .getByRole("button", { name: /^Panel/ })
      .click()
    await expect(slide(page, "Organizing")).toBeVisible()

    await deck(page).getByRole("button", { name: "Back", exact: true }).click()
    await expect(
      deck(page).getByRole("button", { name: /^Panel/ })
    ).toHaveAttribute("aria-pressed", "true")
  })

  test("signing in mid-deck keeps it open and adds the signed-in slide", async ({
    page,
  }) => {
    await page.goto("/")
    for (const name of [
      "Doska",
      "Cards",
      "Opening cards",
      "Organizing",
      "Members",
    ]) {
      await expect(slide(page, name)).toBeVisible()
      await next(page)
    }
    await expect(slide(page, "Sign in to your server")).toBeVisible()

    await deck(page).getByPlaceholder("Login").fill(TEST_CREDENTIALS.login)
    await deck(page)
      .getByPlaceholder("Password")
      .fill(TEST_CREDENTIALS.password)
    await deck(page)
      .getByRole("button", { name: "Sign in", exact: true })
      .click()

    await expect(slide(page, "Signed in")).toBeVisible()
    await next(page)
    await expect(slide(page, "That's it")).toBeVisible()
    await deck(page).getByRole("button", { name: "Done", exact: true }).click()

    await expect(sidebarAccount(page)).toBeVisible()
  })
})
