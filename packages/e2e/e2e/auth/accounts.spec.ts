import { test, expect, type Page } from "@playwright/test"
import { signIn, signOut } from "../helpers"

/**
 * Account management: the owner creates accounts, deactivates them and resets
 * their passwords, and the accounts it creates are ordinary users with no way
 * into the accounts modal at all.
 *
 * Every login is unique per run because deactivating is the normal end of an
 * account — the server keeps almost every one this suite has ever made.
 */

function uniqueLogin(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

/** Opens the accounts modal from settings, where only an owner is offered it. */
async function openAccounts(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("button", { name: "Accounts" }).click()
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible()
}

/** Closes the modal. The sidebar is out of the a11y tree while it is open, so
 * nothing behind it is reachable until this runs. */
async function closeAccounts(page: Page): Promise<void> {
  await page.keyboard.press("Escape")
  await expect(page.getByRole("heading", { name: "Accounts" })).toHaveCount(0)
}

async function addAccount(
  page: Page,
  login: string,
  password: string
): Promise<void> {
  await page.getByPlaceholder("Login").fill(login)
  await page.getByPlaceholder("Password").fill(password)
  await page.getByRole("button", { name: "Add", exact: true }).click()
  await expect(accountRow(page, login)).toBeVisible()
}

/** Matched on the login exactly: every account this suite makes is named
 * `e2e-something`, so a substring match on the owner's `e2e` would hit them all. */
function accountRow(page: Page, login: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByText(login, { exact: true }) })
}

test.describe("account management", () => {
  test("an account the owner creates is not itself an owner", async ({
    page,
  }) => {
    const account = { login: uniqueLogin("plain"), password: "created-pass" }

    await signIn(page)
    await openAccounts(page)
    await addAccount(page, account.login, account.password)
    await closeAccounts(page)
    await signOut(page)

    await signIn(page, account)

    // Settings opens for it, with no way into accounts in it at all.
    await page.getByRole("button", { name: "Settings" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("button", { name: "Accounts" })).toHaveCount(0)
  })

  test("a login that is taken is reported, not thrown", async ({ page }) => {
    const login = uniqueLogin("dupe")

    await signIn(page)
    await openAccounts(page)
    await addAccount(page, login, "created-pass")

    await page.getByPlaceholder("Login").fill(login)
    await page.getByPlaceholder("Password").fill("another-pass")
    await page.getByRole("button", { name: "Add", exact: true }).click()

    await expect(
      page.getByRole("dialog").getByText("That login is already taken.")
    ).toBeVisible()
    await expect(accountRow(page, login)).toHaveCount(1)
  })

  test("the owner cannot deactivate their own account", async ({ page }) => {
    await signIn(page)
    await openAccounts(page)

    const own = accountRow(page, "e2e")
    await expect(
      own.getByRole("button", { name: "Change password" })
    ).toBeVisible()
    await expect(own.getByRole("button", { name: "Deactivate" })).toHaveCount(0)
  })

  test("a deactivated account is refused, and works again once restored", async ({
    page,
  }) => {
    const account = { login: uniqueLogin("banned"), password: "created-pass" }

    await signIn(page)
    await openAccounts(page)
    await addAccount(page, account.login, account.password)
    await accountRow(page, account.login)
      .getByRole("button", { name: "Deactivate" })
      .click()
    await expect(accountRow(page, account.login)).toContainText("Inactive")
    await closeAccounts(page)
    await signOut(page)

    await page.goto("/")
    await page
      .getByRole("button", { name: "Sign in to sync", exact: true })
      .click()
    await page.getByPlaceholder("Login").fill(account.login)
    await page.getByPlaceholder("Password").fill(account.password)
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await expect(page.getByText("Invalid credentials.")).toBeVisible()

    await signIn(page)
    await openAccounts(page)
    await accountRow(page, account.login)
      .getByRole("button", { name: "Activate" })
      .click()
    await expect(accountRow(page, account.login)).not.toContainText("Inactive")
    await closeAccounts(page)
    await signOut(page)

    await signIn(page, account)
  })

  test("an account can only be deleted once it is deactivated", async ({
    page,
  }) => {
    const login = uniqueLogin("deleted")

    await signIn(page)
    await openAccounts(page)
    await addAccount(page, login, "created-pass")

    const row = accountRow(page, login)
    // Deleting is offered only at the end of the deactivated path.
    await expect(row.getByRole("button", { name: "Delete" })).toHaveCount(0)

    await row.getByRole("button", { name: "Deactivate" }).click()
    await expect(row).toContainText("Inactive")
    await row.getByRole("button", { name: "Delete", exact: true }).click()

    // The dialog reports what the account still holds before it offers the deed.
    const dialog = page.getByRole("dialog").filter({ hasText: "Delete " })
    await expect(dialog.getByText("owns no boards")).toBeVisible()
    await dialog.getByRole("button", { name: "Delete account" }).click()

    await expect(accountRow(page, login)).toHaveCount(0)
  })

  test("resetting a password refuses the old one and accepts the new", async ({
    page,
  }) => {
    const login = uniqueLogin("reset")

    await signIn(page)
    await openAccounts(page)
    await addAccount(page, login, "first-pass")

    const row = accountRow(page, login)
    await row.getByRole("button", { name: "Change password" }).click()
    await page.getByPlaceholder("New password").fill("second-pass")
    await row.getByRole("button", { name: "Save" }).click()
    // The form closes on success, which is how we know the write landed.
    await expect(page.getByPlaceholder("New password")).toHaveCount(0)

    await closeAccounts(page)
    await signOut(page)

    await page.goto("/")
    await page
      .getByRole("button", { name: "Sign in to sync", exact: true })
      .click()
    await page.getByPlaceholder("Login").fill(login)
    await page.getByPlaceholder("Password").fill("first-pass")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await expect(page.getByText("Invalid credentials.")).toBeVisible()

    await signIn(page, { login, password: "second-pass" })
  })
})
