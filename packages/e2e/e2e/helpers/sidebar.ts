import { expect, type APIRequestContext, type Page } from "@playwright/test"
import type { SidebarItem, SidebarLayout } from "@doska/contract"
import { dashboardSync, newerThan } from "./rpc"

/* -------------------------------------------------------------------------- */
/*  Sidebar tree helpers. The tree is read the way a user sees it: row titles */
/*  top to bottom, with a folder's boards indented under it.                   */
/* -------------------------------------------------------------------------- */

/** The "Boards" group of the sidebar; Upcoming and Trash sit in another one. */
function boardsGroup(page: Page) {
  return page
    .locator('[data-slot="sidebar-group"]')
    .filter({ has: page.getByText("Boards", { exact: true }) })
}

/** A tree row (board or folder) by its exact title. Rows are the drag handles. */
export function sidebarRow(page: Page, title: string) {
  return boardsGroup(page)
    .locator("[data-rfd-draggable-id]")
    .filter({ has: page.getByRole("button", { name: title, exact: true }) })
}

/**
 * A folder's own button: toggles collapse, and carries the expanded state.
 * Scoped inside the row: the row itself is a dnd drag handle, which makes it
 * a button named after its contents too.
 */
export function folder(page: Page, title: string) {
  return sidebarRow(page, title).getByRole("button", {
    name: title,
    exact: true,
  })
}

/**
 * The tree as the user reads it, top to bottom. A board inside a folder is
 * indented, so it comes back with two leading spaces: `["Work", "  Alpha"]`.
 * The "No boards yet" placeholder is left out — it's asserted on its own.
 */
export async function sidebarTree(page: Page): Promise<string[]> {
  return boardsGroup(page)
    .locator("[data-rfd-draggable-id]")
    .evaluateAll((rows) => {
      const left = Math.min(
        ...rows.map((row) => row.getBoundingClientRect().left)
      )
      const tree: string[] = []
      for (const row of rows) {
        const button = row.querySelector('[data-slot="sidebar-menu-button"]')
        if (!button) continue
        const indent = button.getBoundingClientRect().left - left
        const title = (button.textContent ?? "").trim()
        tree.push(`${indent > 8 ? "  " : ""}${title}`)
      }
      return tree
    })
}

/**
 * The "No boards yet" rows currently showing. Every expanded folder has one,
 * collapsed to zero height once it holds a board — the text inside still has
 * a box then, so visibility is judged on the row.
 */
export function emptyFolderNotes(page: Page) {
  return boardsGroup(page)
    .locator("[data-rfd-draggable-id]")
    .filter({ hasText: "No boards yet" })
    .filter({ visible: true })
}

/**
 * Creates a folder from the header button. The new folder opens in rename
 * mode with "New folder" selected, so typing replaces it; Enter commits.
 */
export async function createFolder(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "New folder" }).click()
  const input = page.getByRole("textbox", { name: "Folder name" })
  await expect(input).toHaveValue("New folder")
  await input.fill(title)
  await input.press("Enter")
  await expect(folder(page, title)).toBeVisible()
}

/** Opens the "⋮" menu of the folder titled `title`. */
export async function openFolderMenu(page: Page, title: string): Promise<void> {
  await sidebarRow(page, title).hover()
  await sidebarRow(page, title)
    .getByRole("button", { name: "Folder actions" })
    .click()
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible()
}

export async function renameFolder(
  page: Page,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  await openFolderMenu(page, fromTitle)
  await page.getByRole("menuitem", { name: "Rename" }).click()
  const input = page.getByRole("textbox", { name: "Folder name" })
  await input.fill(toTitle)
  await input.press("Enter")
  await expect(folder(page, toTitle)).toBeVisible()
}

export async function deleteFolder(page: Page, title: string): Promise<void> {
  await openFolderMenu(page, title)
  await page.getByRole("menuitem", { name: "Delete folder" }).click()
  await expect(folder(page, title)).toHaveCount(0)
}

/** What @hello-pangea/dnd announces to screen readers as a drag progresses. */
function dragAnnouncement(page: Page, text: RegExp) {
  return page.locator('[id^="rfd-announcement-"]').filter({ hasText: text })
}

/**
 * Keyboard-drags the tree row titled `title`: focus the row, Space to lift,
 * the given moves ("ArrowDown"/"ArrowUp"), Space to drop. Keyboard drags
 * have no pointer, so a root board stays at the root when dropped right after
 * a folder's last board, and a nested one stays in its folder there — the
 * pull-right/left nesting gesture is pointer-only.
 */
export async function dragSidebarRow(
  page: Page,
  title: string,
  moves: string[]
): Promise<void> {
  await sidebarRow(page, title).focus()
  await page.keyboard.press("Space")
  await expect(dragAnnouncement(page, /have lifted an item/)).toHaveCount(1)
  for (const move of moves) {
    await page.keyboard.press(move)
    await page.waitForTimeout(250)
  }
  await page.keyboard.press("Space")
  await expect(dragAnnouncement(page, /have dropped the item/)).toHaveCount(1)
  await page.waitForTimeout(350) // wait out the drop animation
  // The drop leaves the row focused. A folder menu opened next returns focus
  // to it on close, which blurs the rename input and commits it untouched.
  await sidebarRow(page, title).blur()
}

/* -------------------------------------------------------------------------- */
/*  Second-client layout ops — the same account's other device.                */
/* -------------------------------------------------------------------------- */

/** The account's layout as the server holds it, or null before the first push. */
export async function readSidebarLayout(
  request: APIRequestContext
): Promise<SidebarLayout | null> {
  const { changes } = await dashboardSync(request, { since: 0, changes: [] })
  for (const c of changes) if (c.store === "sidebar") return c.record
  return null
}

/** Polls until the server's layout satisfies `check`, and returns it. */
export async function waitForSidebarLayout(
  request: APIRequestContext,
  check: (layout: SidebarLayout) => boolean,
  timeoutMs = 8000
): Promise<SidebarLayout> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const layout = await readSidebarLayout(request)
    if (layout && check(layout)) return layout
    if (Date.now() > deadline)
      throw new Error("timed out waiting for the sidebar layout on the server")
    await new Promise((r) => setTimeout(r, 150))
  }
}

/** Titles of the folders in a server-side layout. */
export function layoutFolderTitles(layout: SidebarLayout): string[] {
  return layout.items.flatMap((item) =>
    item.type === "folder" ? [item.title] : []
  )
}

/**
 * Another device replaces the whole layout. Stamped past whatever the server
 * holds, so it wins last-writer-wins; pass `updatedAt` to send a stale one.
 */
export async function remoteSetSidebarLayout(
  request: APIRequestContext,
  items: SidebarItem[],
  updatedAt?: number
): Promise<void> {
  const existing = await readSidebarLayout(request)
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "sidebar",
        record: {
          id: "layout",
          items,
          updatedAt: updatedAt ?? newerThan(existing ?? { updatedAt: 0 }),
          deletedAt: null,
        },
      },
    ],
  })
}

export function remoteFolder(
  title: string,
  boardIds: string[] = []
): SidebarItem {
  return {
    type: "folder",
    id: `folder-${crypto.randomUUID().slice(0, 8)}`,
    title,
    collapsed: false,
    boardIds,
  }
}
