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
  await page.getByRole("button", { name: "Sign in to sync", exact: true }).click()
  await page.getByPlaceholder("Login").fill(TEST_CREDENTIALS.login)
  await page.getByPlaceholder("Password").fill(TEST_CREDENTIALS.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByPlaceholder("Login")).toBeHidden()
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
 * Authorizes a raw request context (the simulated second client) by logging in
 * over the API, so its direct `/api/rpc` calls are accepted.
 */
export async function authenticate(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/auth/login", { data: TEST_CREDENTIALS })
  if (!res.ok())
    throw new Error(`e2e login failed (${res.status()}): ${await res.text()}`)
}
