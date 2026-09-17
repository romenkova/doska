import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  columnCardTitles,
  createBoard,
  createFolder,
  dragSidebarRow,
  editCardBody,
  folder,
  openBoardInSidebar,
  renameBoard,
  retitleCard,
  sidebarRow,
  sidebarTree,
} from "../helpers"

/**
 * A card dragged onto a board in the sidebar moves to that board, landing on
 * top of its first column. Over the sidebar the dragged card shrinks to its
 * title, and a collapsed folder it hovers opens up to offer its boards.
 *
 * Keyboard dragging can't reach the sidebar (it is not a dnd droppable), so
 * these drive the pointer: press on the card, nudge past the drag threshold,
 * then glide to the sidebar row.
 */

async function liftCard(page: Page, title: string): Promise<void> {
  const box = await card(page, title).boundingBox()
  if (!box) throw new Error(`card "${title}" has no box`)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2, {
    steps: 5,
  })
}

async function hoverSidebarRow(page: Page, title: string): Promise<void> {
  const box = await sidebarRow(page, title).boundingBox()
  if (!box) throw new Error(`sidebar row "${title}" has no box`)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 15,
  })
}

async function newBoard(page: Page, name: string): Promise<void> {
  await createBoard(page)
  await renameBoard(page, "Untitled board", name)
}

test.describe("move a card to another board", () => {
  test("dropping a card on a sidebar board moves it there", async ({
    page,
  }) => {
    await newBoard(page, "Alpha")
    await newBoard(page, "Beta")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Roamer")
    await editCardBody(page, "Roamer", "Some notes")
    await expect(card(page, "Roamer")).toContainText("Some notes")
    const wide = (await card(page, "Roamer").boundingBox())!.width

    await liftCard(page, "Roamer")
    await hoverSidebarRow(page, "Alpha")
    // Over the sidebar the card fades out under a chip beside it: its title,
    // narrower than the card.
    const chip = page.getByText("Roamer").last()
    await expect(chip).toBeVisible()
    await expect
      .poll(async () => (await chip.boundingBox())!.width)
      .toBeLessThan(wide)
    await page.mouse.up()

    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])

    await openBoardInSidebar(page, "Alpha")
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual(["Roamer"])
    await expect(card(page, "Roamer")).toContainText("Some notes")

    await page.reload()
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual(["Roamer"])
  })

  test("a collapsed folder opens under the card", async ({ page }) => {
    await page.goto("/")
    await createFolder(page, "Work")
    await newBoard(page, "Alpha")
    await dragSidebarRow(page, "Alpha", ["ArrowDown"])
    await expect
      .poll(() => sidebarTree(page))
      .toEqual(["Work", "  Alpha", "Welcome"])
    await folder(page, "Work").click()
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "false")

    await newBoard(page, "Beta")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Roamer")

    await liftCard(page, "Roamer")
    await hoverSidebarRow(page, "Work")
    await expect(folder(page, "Work")).toHaveAttribute("aria-expanded", "true")
    await hoverSidebarRow(page, "Alpha")
    await page.mouse.up()

    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])
    await openBoardInSidebar(page, "Alpha")
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual(["Roamer"])
  })
})
