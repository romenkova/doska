import { expect, type APIRequestContext, type Page } from "@playwright/test"

/**
 * The single credential pair the e2e API server is booted with (see
 * playwright.config). Sync is gated behind it; local editing is not.
 *
 * Overridable because the container run signs in to a self-host stack seeded
 * from its own .env (see playwright.container.config).
 */
export const TEST_CREDENTIALS = {
  login: process.env.AUTH_LOGIN || "e2e",
  password: process.env.AUTH_PASSWORD || "e2e-secret",
}

/**
 * The sidebar's sign-in control: the whole account row, labelled so only once
 * the session check has resolved to signed-out. Scoped to the sidebar because
 * an open board shows a second control with the same accessible name (the
 * deck's sync indicator turns into one while signed out).
 */
function sidebarSignIn(page: Page) {
  return page
    .locator('[data-slot="sidebar"]')
    .getByRole("button", { name: "Sign in to sync", exact: true })
}

/**
 * The sidebar's account row, by the login it names. This is the signed-in
 * signal: it appears once the session check, or a sign-in, resolves to a
 * session. Clicking it opens the account modal.
 */
export function sidebarAccount(page: Page, login = TEST_CREDENTIALS.login) {
  return page.locator('[data-slot="sidebar"]').getByText(login, { exact: true })
}

/**
 * Signs the open page in through the UI so its background sync is authorized —
 * the same steps a user takes: the sidebar's sign-in control, then the modal.
 * The sign-in control only appears once the session check resolves to
 * signed-out, which Playwright auto-waits for.
 */
export async function signIn(
  page: Page,
  credentials: { login: string; password: string } = TEST_CREDENTIALS
): Promise<void> {
  await page.goto("/")
  await sidebarSignIn(page).click()
  await page.getByPlaceholder("Login").fill(credentials.login)
  await page.getByPlaceholder("Password").fill(credentials.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  // Wait for the *signed-in* state, not the absence of the signed-out control:
  // an open modal already hides the sidebar from the a11y tree, so asserting
  // the sign-in control is gone passes the moment the dialog opens, before the
  // request even lands, and the next navigation cancels it mid-flight.
  await expect(sidebarAccount(page, credentials.login)).toBeVisible()
}

/**
 * Signs the open page out from the account modal (which closes itself on the
 * way), and waits for the signed-out state (the sign-in control returns). Pass
 * the login when the page is signed in as someone other than the default.
 */
export async function signOut(
  page: Page,
  login: string = TEST_CREDENTIALS.login
): Promise<void> {
  await sidebarAccount(page, login).click()
  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(sidebarSignIn(page)).toBeVisible()
}

/**
 * Authorizes a raw request context (the simulated second client), so its direct
 * `/api/rpc` calls are accepted. The account is seeded with a login rather than
 * an email, so this is better-auth's username sign-in; the context keeps the
 * session cookie it answers with, exactly as a browser would.
 */
export async function authenticate(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/auth/sign-in/username", {
    data: {
      username: TEST_CREDENTIALS.login,
      password: TEST_CREDENTIALS.password,
    },
  })
  if (!res.ok())
    throw new Error(`e2e sign-in failed (${res.status()}): ${await res.text()}`)
}
