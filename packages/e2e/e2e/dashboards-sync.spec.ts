import { test, expect } from "@playwright/test"
import {
  authenticate,
  remoteCreateDashboard,
  remoteRenameDashboard,
  signIn,
} from "./helpers"

/**
 * The dashboard *list* syncs on its own board-independent channel, so a board
 * another client creates or renames shows up in an authorized session's sidebar
 * even though that session never opens it. The page is one client; the test
 * plays a second one straight against the backend, then asserts on what the
 * sidebar shows — never on ids or storage.
 *
 * This is the regression these tests guard: sync used to fetch only the open
 * board's data, leaving every other dashboard out of scope, so the list never
 * converged once signed in.
 */
test.describe("dashboard list sync", () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)
  })

  test("a board another client creates appears in the sidebar", async ({
    page,
    request,
  }) => {
    await remoteCreateDashboard(request, "Teammate's roadmap")

    await expect(
      page.getByRole("button", { name: "Teammate's roadmap" })
    ).toBeVisible()
  })

  test("a board another client renames updates in the sidebar", async ({
    page,
    request,
  }) => {
    const id = await remoteCreateDashboard(request, "Working title")
    await expect(
      page.getByRole("button", { name: "Working title" })
    ).toBeVisible()

    await remoteRenameDashboard(request, id, "Final title")

    await expect(
      page.getByRole("button", { name: "Final title" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Working title" })
    ).toHaveCount(0)
  })
})
