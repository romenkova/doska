import { test, expect, type Page } from "@playwright/test"
import {
  authenticate,
  createAccount,
  createBoard,
  createFolder,
  createSubfolder,
  deleteFolder,
  dragSidebarRow,
  folder,
  openFolderMenu,
  remoteCreateDashboard,
  remoteFolder,
  remoteSetSidebarLayout,
  renameBoard,
  sidebarTree,
  signIn,
  waitForSidebarLayout,
} from "../helpers"

/**
 * Folders nest to any depth. A subfolder sits above its parent's boards, and
 * deleting a folder hands everything in it to the level above.
 */

/** "Work" holding "Drafts" > "Old", plus the board "Alpha". */
async function nestedFolders(page: Page): Promise<void> {
  await page.goto("/")
  await createFolder(page, "Work")
  await createBoard(page)
  await renameBoard(page, "Untitled board", "Alpha")
  await dragSidebarRow(page, "Alpha", ["ArrowDown"])
  await createSubfolder(page, "Work", "Drafts")
  await createSubfolder(page, "Drafts", "Old")
  await expect
    .poll(() => sidebarTree(page))
    .toEqual(["Work", "  Drafts", "    Old", "  Alpha", "Demo board"])
}

test.describe("sidebar subfolders", () => {
  test("a new subfolder lands above its parent's boards and persists", async ({
    page,
  }) => {
    await nestedFolders(page)

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Drafts", "    Old", "  Alpha", "Demo board"])
  })

  test("a new subfolder opens its collapsed parent", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await folder(page, "Work").click()
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "false")

    await createSubfolder(page, "Work", "Drafts")

    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "true")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Drafts", "Demo board"])
  })

  test("collapsing a folder hides everything nested in it", async ({
    page,
  }) => {
    await nestedFolders(page)

    await folder(page, "Work").click()
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Demo board"])

    await folder(page, "Work").click()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Drafts", "    Old", "  Alpha", "Demo board"])
  })

  test("deleting a subfolder hands its subfolders to the parent", async ({
    page,
  }) => {
    await nestedFolders(page)

    await deleteFolder(page, "Drafts")

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Old", "  Alpha", "Demo board"])
    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Old", "  Alpha", "Demo board"])
  })

  test("deleting a root folder hands everything in it to the root", async ({
    page,
  }) => {
    await nestedFolders(page)

    await deleteFolder(page, "Work")

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Drafts", "  Old", "Alpha", "Demo board"])
  })

  test("folders nest five levels deep and no further", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "L1")
    for (const level of [2, 3, 4, 5]) {
      await createSubfolder(page, `L${level - 1}`, `L${level}`)
    }
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["L1", "  L2", "    L3", "      L4", "        L5", "Demo board"])

    await openFolderMenu(page, "L5")
    await expect(
      page.getByRole("menuitem", { name: "New subfolder" })
    ).toHaveCount(0)
  })
})

/** Each test signs in as its own account, see layout-sync.spec. */
test.describe("sidebar subfolders sync", () => {
  test("a subfolder made here reaches the server under its parent", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "subfolders")
    await signIn(page, account)
    await authenticate(request, account)

    await createFolder(page, "Work")
    await createSubfolder(page, "Work", "Drafts")

    const layout = await waitForSidebarLayout(request, (l) =>
      l.items.some((item) => item.type === "folder" && item.title === "Drafts")
    )
    const folders = layout.items.filter((item) => item.type === "folder")
    const work = folders.find((item) => item.title === "Work")
    const drafts = folders.find((item) => item.title === "Drafts")
    expect(work?.parentId).toBeUndefined()
    expect(drafts?.parentId).toBe(work?.id)
  })

  test("a nested layout another device pushes shows up nested", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "subfolders")
    await signIn(page, account)
    await authenticate(request, account)
    const id = await remoteCreateDashboard(request, "Remote board")
    await expect(
      page.getByRole("button", { name: "Remote board" })
    ).toBeVisible()

    const outer = remoteFolder("Outer")
    await remoteSetSidebarLayout(request, [
      outer,
      remoteFolder("Inner", [id], outer.id),
    ])

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Outer", "  Inner", "    Remote board", "Demo board"])
  })

  test("a subfolder whose parent is gone shows at the root", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, "subfolders")
    await signIn(page, account)
    await authenticate(request, account)
    const id = await remoteCreateDashboard(request, "Remote board")
    await expect(
      page.getByRole("button", { name: "Remote board" })
    ).toBeVisible()

    await remoteSetSidebarLayout(request, [
      remoteFolder("Orphan", [id], "folder-gone"),
    ])

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Orphan", "  Remote board", "Demo board"])
  })
})
