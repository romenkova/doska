import { expect, type APIRequestContext, type Page } from "@playwright/test"

/**
 * The single credential pair the e2e API server is booted with (see
 * playwright.config). Sync is gated behind it; local editing is not.
 */
export const TEST_CREDENTIALS = { login: "e2e", password: "e2e-secret" }

/**
 * Signs the open page in through the UI so its background sync is authorized —
 * the same steps a user takes: the sidebar's sign-in control, then the modal.
 * The sign-in control only appears once the session check resolves to
 * signed-out, which Playwright auto-waits for.
 */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/")
  // `exact` so this picks the sign-in control, not the account row that wraps it
  // (whose accessible name also ends in "Sign in to sync").
  await page
    .getByRole("button", { name: "Sign in to sync", exact: true })
    .click()
  await page.getByPlaceholder("Login").fill(TEST_CREDENTIALS.login)
  await page.getByPlaceholder("Password").fill(TEST_CREDENTIALS.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  // Wait for the *signed-in* control, not the absence of the signed-out one: an
  // open modal already hides the sidebar from the a11y tree, so asserting the
  // sign-in control is gone passes the moment the dialog opens — before the
  // request even lands — and the next navigation cancels it mid-flight.
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
}

/**
 * Signs the open page out via the sidebar account control, and waits for the
 * signed-out state (the sign-in control returns).
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(
    page.getByRole("button", { name: "Sign in to sync", exact: true })
  ).toBeVisible()
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
