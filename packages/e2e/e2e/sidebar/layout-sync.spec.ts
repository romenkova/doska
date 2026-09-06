import { test, expect } from "@playwright/test"
import {
  authenticate,
  createAccount,
  createFolder,
  folder,
  layoutFolderTitles,
  readSidebarLayout,
  remoteCreateDashboard,
  remoteFolder,
  remoteSetSidebarLayout,
  sidebarTree,
  signIn,
  signOut,
  waitForSidebarLayout,
} from "../helpers"

/**
 * The sidebar layout is one record per account on the dashboard-list channel,
 * last writer wins. Every signed-in spec in the suite pushes the shared `e2e`
 * account's record whenever it makes a board, so a folder asserted on there
 * would race the other workers: each test here signs in as an account of its
 * own, made over the same admin call the accounts modal uses.
 */
test.describe("sidebar layout sync", () => {
  test("a folder made here reaches the server", async ({ page, request }) => {
    const account = await createAccount(request, "layout")
    await signIn(page, account)
    await authenticate(request, account)

    await createFolder(page, "Synced work")

    const layout = await waitForSidebarLayout(request, (l) =>
      layoutFolderTitles(l).includes("Synced work")
    )
    expect(layoutFolderTitles(layout)).toEqual(["Synced work"])
  })

  test("a layout another device pushes shows up, boards and all", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "layout")
    await signIn(page, account)
    await authenticate(request, account)
    const id = await remoteCreateDashboard(request, "Remote board")
    await expect(
      page.getByRole("button", { name: "Remote board" })
    ).toBeVisible()

    await remoteSetSidebarLayout(request, [remoteFolder("Remote folder", [id])])

    await expect(folder(page, "Remote folder")).toBeVisible()
    // Welcome was claimed by this account but isn't in the pushed layout, so
    // it trails the tree at the root.
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Remote folder", "  Remote board", "Welcome"])
  })

  test("a stale layout from another device loses to the one here", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "layout")
    await signIn(page, account)
    await authenticate(request, account)
    await createFolder(page, "Mine")
    const mine = await waitForSidebarLayout(request, (l) =>
      layoutFolderTitles(l).includes("Mine")
    )

    await remoteSetSidebarLayout(
      request,
      [remoteFolder("Stale")],
      mine.updatedAt - 1
    )

    // A few sync ticks (the e2e bundle polls sub-second) are enough for a win
    // to have painted; nothing happens because there wasn't one.
    await page.waitForTimeout(1500)
    await expect(folder(page, "Stale")).toHaveCount(0)
    await expect(folder(page, "Mine")).toBeVisible()
    expect(layoutFolderTitles((await readSidebarLayout(request))!)).toEqual([
      "Mine",
    ])
  })

  test("a board another device creates lands at the bottom of the root", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "layout")
    await signIn(page, account)
    await authenticate(request, account)
    await createFolder(page, "Work")
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])

    await remoteCreateDashboard(request, "Remote board")

    // Not in the (expanded, empty) folder on top, and not above the others.
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Welcome", "Remote board"])
  })

  test("folders made before signing in go with the boards to the account", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "layout")
    await page.goto("/")
    await createFolder(page, "Offline work")

    await signIn(page, account)
    await authenticate(request, account)

    await expect(folder(page, "Offline work")).toBeVisible()
    const layout = await waitForSidebarLayout(request, (l) =>
      layoutFolderTitles(l).includes("Offline work")
    )
    expect(layoutFolderTitles(layout)).toEqual(["Offline work"])

    await page.reload()
    await expect(folder(page, "Offline work")).toBeVisible()
  })

  test("another account sees none of the first's folders", async ({
    page,
    request,
  }) => {
    const first = await createAccount(request, "layout")
    const second = await createAccount(request, "layout")
    await signIn(page, first)
    await authenticate(request, first)
    await createFolder(page, "Private work")
    await waitForSidebarLayout(request, (l) =>
      layoutFolderTitles(l).includes("Private work")
    )

    await signOut(page, first.login)
    await signIn(page, second)

    await expect(folder(page, "Private work")).toHaveCount(0)
    await expect.poll(() => sidebarTree(page)).toEqual([])
    await authenticate(request, second)
    expect(await readSidebarLayout(request)).toBeNull()
  })
})
