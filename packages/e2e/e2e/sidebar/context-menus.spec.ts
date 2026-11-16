import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  boardTitle,
  card,
  createBoard,
  createFolder,
  folder,
  renameBoard,
  retitleCard,
  sidebarRow,
  sidebarTree,
} from "../helpers"

async function rightClickRow(page: Page, title: string): Promise<void> {
  await sidebarRow(page, title)
    .getByRole("button", { name: title, exact: true })
    .click({ button: "right" })
}

test.describe("sidebar context menus", () => {
  test("Duplicate on a board opens a copy with its cards", async ({ page }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Alpha")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Ship it")
    const original = page.url()

    await rightClickRow(page, "Alpha")
    await page.getByRole("menuitem", { name: "Duplicate" }).click()

    await expect.poll(() => page.url()).not.toBe(original)
    await expect(boardTitle(page, "Alpha")).toBeVisible()
    await expect(card(page, "Ship it")).toBeVisible()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Alpha", "Alpha", "Demo board"])
  })

  test("Delete board on a board asks first", async ({ page }) => {
    await createBoard(page)
    await renameBoard(page, "Untitled board", "Alpha")

    await rightClickRow(page, "Alpha")
    await page.getByRole("menuitem", { name: "Delete board" }).click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete board" })
      .click()

    await expect.poll(() => sidebarTree(page)).toEqual(["Demo board"])
  })

  test("a folder's menu works on right-click", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")

    await rightClickRow(page, "Work")
    await page.getByRole("menuitem", { name: "Rename" }).click()
    const input = page.getByRole("textbox", { name: "Folder name" })
    await input.fill("Home")
    await input.press("Enter")
    await expect(folder(page, "Home")).toBeVisible()

    await rightClickRow(page, "Home")
    await page.getByRole("menuitem", { name: "Delete folder" }).click()
    await expect(folder(page, "Home")).toHaveCount(0)
  })
})
