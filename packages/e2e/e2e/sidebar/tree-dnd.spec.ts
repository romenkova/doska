import { test, expect } from "@playwright/test"
import {
  createBoard,
  createFolder,
  dragSidebarRow,
  folder,
  renameBoard,
  sidebarTree,
} from "../helpers"

/**
 * Reordering the sidebar is one vertical list where a board dropped under a
 * folder's header or between its boards goes into the folder. Folders only
 * ever sit at the root, and they take their boards along.
 *
 * Driven with @hello-pangea/dnd's keyboard dragging (Space to lift, arrows to
 * move, Space to drop), like the card dnd spec — far steadier than synthesized
 * pointer moves. Trees are asserted as the titles a user reads, top to bottom,
 * with a folder's boards indented.
 */

async function newBoard(page: Parameters<typeof createBoard>[0], name: string) {
  await createBoard(page)
  await renameBoard(page, "Untitled board", name)
}

test.describe("sidebar drag and drop", () => {
  test("reordering root boards persists", async ({ page }) => {
    await newBoard(page, "Alpha")
    await newBoard(page, "Beta")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Beta", "Alpha", "Welcome"])

    await dragSidebarRow(page, "Beta", ["ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Alpha", "Beta", "Welcome"])

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Alpha", "Beta", "Welcome"])
  })

  test("a board dropped under a folder's header goes into it", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await newBoard(page, "Alpha")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Alpha", "Work", "Welcome"])

    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])

    // Really inside: collapsing the folder takes the board with it.
    await folder(page, "Work").click()
    await expect.poll(() => sidebarTree(page)).toEqual(["Work", "Welcome"])
    await folder(page, "Work").click()

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])
  })

  test("a board dropped past the next root board leaves its folder", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])

    // One step down is still the folder's last slot; two is under Welcome.
    await dragSidebarRow(page, "Alpha", ["ArrowDown", "ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Welcome", "Alpha"])

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Welcome", "Alpha"])
  })

  test("a root board dropped right after a folder's last board stays at the root", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await newBoard(page, "Beta")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Beta", "Work", "  Alpha", "Welcome"])

    // Nesting at the end of a folder is the pull-right gesture, which a
    // keyboard drag never makes: the slot after Alpha is a root slot.
    await dragSidebarRow(page, "Beta", ["ArrowDown", "ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Beta", "Welcome"])

    await folder(page, "Work").click()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Beta", "Welcome"])
  })

  test("a board moved between two folders changes folder", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Home")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await createFolder(page, "Work")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Home", "  Alpha", "Welcome"])

    // Up past Home's header and Work's empty slot: under Work's header.
    await dragSidebarRow(page, "Alpha", ["ArrowUp", "ArrowUp"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Home", "Welcome"])
  })

  test("a folder takes its boards along when moved", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])

    // Its boards fold into the lifted folder, so the only slot below is
    // after Welcome — the lift still counts the folded rows as steps.
    await dragSidebarRow(page, "Work", ["ArrowDown", "ArrowDown", "ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Welcome", "Work", "  Alpha"])

    await page.reload()
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Welcome", "Work", "  Alpha"])
  })

  test("a folder dropped among another folder's boards lands after it at the root", async ({
    page,
  }) => {
    await page.goto("/")
    await createFolder(page, "Home")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await createFolder(page, "Work")
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "Home", "  Alpha", "Welcome"])

    // Three steps: over Work's own (folded) empty slot, Home's header, Alpha.
    await dragSidebarRow(page, "Work", ["ArrowDown", "ArrowDown", "ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Home", "  Alpha", "Work", "Welcome"])
  })

  test("dropping where it was lifted changes nothing", async ({ page }) => {
    await newBoard(page, "Alpha")
    await expect.poll(() => sidebarTree(page)).toEqual(["Alpha", "Welcome"])

    await dragSidebarRow(page, "Alpha", ["ArrowDown", "ArrowUp"])
    await expect.poll(() => sidebarTree(page)).toEqual(["Alpha", "Welcome"])
  })
})
