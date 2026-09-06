import { test, expect, type Page } from "@playwright/test"
import {
  createBoard,
  createFolder,
  deleteBoard,
  deleteFolder,
  dragSidebarRow,
  emptyFolderNotes,
  folder,
  openBoardInSidebar,
  openFolderMenu,
  openTrash,
  renameBoard,
  renameFolder,
  restoreFromTrash,
  sidebarTree,
} from "../helpers"

/**
 * Folders group boards in the sidebar. They live only in the sidebar layout:
 * nothing about a board changes when it goes into one, and a deleted folder
 * hands its boards back to the root. A fresh device starts with the seeded
 * "Welcome" board at the root, which is why it shows up in every tree.
 */

/** A "Work" folder holding "Alpha", above the seeded Welcome board. */
async function folderWithBoard(page: Page): Promise<void> {
  await page.goto("/")
  await createFolder(page, "Work")
  // A new board lands on top of the root, right above the folder; one step
  // down drops it under the folder's header, which is inside it.
  await createBoard(page)
  await renameBoard(page, "Untitled board", "Alpha")
  await dragSidebarRow(page, "Alpha", ["ArrowDown"])
  await expect
    .poll(() => sidebarTree(page))
    .toEqual(["Work", "  Alpha", "Welcome"])
}

test.describe("sidebar folders", () => {
  test("a new folder lands on top, empty, and is named right away", async ({
    page,
  }) => {
    await page.goto("/")

    await page.getByRole("button", { name: "New folder" }).click()
    const input = page.getByRole("textbox", { name: "Folder name" })
    await expect(input).toBeFocused()
    await expect(input).toHaveValue("New folder")
    await input.fill("Work")
    await input.press("Enter")

    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "true")
    await expect(emptyFolderNotes(page)).toHaveCount(1)
  })

  test("Enter with no name keeps the folder's old one", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await openFolderMenu(page, "Work")
    await page.getByRole("menuitem", { name: "Rename" }).click()
    const input = page.getByRole("textbox", { name: "Folder name" })
    await input.fill("   ")
    await input.press("Enter")

    await expect(folder(page, "Work")).toBeVisible()
    await expect(input).toHaveCount(0)
  })

  test("Escape throws the typed name away", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await openFolderMenu(page, "Work")
    await page.getByRole("menuitem", { name: "Rename" }).click()
    const input = page.getByRole("textbox", { name: "Folder name" })
    await input.fill("Not this")
    await input.press("Escape")

    await expect(folder(page, "Work")).toBeVisible()
    await expect(folder(page, "Not this")).toHaveCount(0)
    await expect(input).toHaveCount(0)
  })

  test("clicking away commits the typed name", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await openFolderMenu(page, "Work")
    await page.getByRole("menuitem", { name: "Rename" }).click()
    await page.getByRole("textbox", { name: "Folder name" }).fill("Elsewhere")
    await page
      .getByRole("heading", { name: "Pick a board to get started" })
      .click()

    await expect(folder(page, "Elsewhere")).toBeVisible()
    await expect(folder(page, "Work")).toHaveCount(0)
  })

  test("a renamed folder keeps its name across a reload", async ({ page }) => {
    await folderWithBoard(page)

    await renameFolder(page, "Work", "Play")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Play", "  Alpha", "Welcome"])

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Play", "  Alpha", "Welcome"])
  })

  test("collapsing hides the folder's boards, and sticks", async ({ page }) => {
    await folderWithBoard(page)

    await folder(page, "Work").click()
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "false")
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])
    // Only hidden, not moved: the board is still open behind the sidebar.
    await expect(page.getByRole("textbox", { name: "Board name" })).toHaveCount(
      0
    )

    await page.reload()
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "false")
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])

    await folder(page, "Work").click()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])
  })

  test("a new board goes to the top of the root, not into the top folder", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await createBoard(page)
    await renameBoard(page, "Untitled board", "Beta")

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Beta", "Work", "Welcome"])
    await expect(emptyFolderNotes(page)).toHaveCount(1)
  })

  test("deleting a folder hands its boards back to the root in place", async ({
    page,
  }) => {
    await folderWithBoard(page)

    await deleteFolder(page, "Work")

    await expect.poll(() => sidebarTree(page)).toEqual(["Alpha", "Welcome"])
    // The board itself is untouched.
    await openBoardInSidebar(page, "Alpha")

    await page.reload()
    await expect.poll(() => sidebarTree(page)).toEqual(["Alpha", "Welcome"])
  })

  test("deleting an empty folder leaves the boards as they were", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await deleteFolder(page, "Work")

    await expect.poll(() => sidebarTree(page)).toEqual(["Welcome"])
    await expect(emptyFolderNotes(page)).toHaveCount(0)
  })

  test("a board deleted inside a folder returns to it when restored", async ({
    page,
  }) => {
    await folderWithBoard(page)

    await openBoardInSidebar(page, "Alpha")
    await deleteBoard(page)
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])
    await expect(emptyFolderNotes(page)).toHaveCount(1)

    await openTrash(page)
    await restoreFromTrash(page, "Alpha")

    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])
  })

  test("the empty note only shows for an expanded folder with nothing in it", async ({
    page,
  }) => {
    await folderWithBoard(page)
    await expect(emptyFolderNotes(page)).toHaveCount(0)

    await createFolder(page, "Spare")
    await expect(emptyFolderNotes(page)).toHaveCount(1)

    await folder(page, "Spare").click()
    await expect(emptyFolderNotes(page)).toHaveCount(0)
  })
})
