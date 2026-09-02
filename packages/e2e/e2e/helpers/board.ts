import { expect, type APIRequestContext, type Page } from "@playwright/test"
import type { Dashboard } from "@doska/contract"
import { dashboardSync, newerThan } from "./rpc"
import { menu } from "./menu"

/* -------------------------------------------------------------------------- */
/*  Board (dashboard) helpers. Everything tests touch is what a user sees:    */
/*  board names in the header and sidebar — never deck ids or storage.        */
/* -------------------------------------------------------------------------- */

/**
 * Creates a fresh board from Home and returns its generated deck id (read off
 * the URL — the one identifier a user can actually see, in their address bar).
 * A new board lands with the three default columns (To Do / In Progress / Done)
 * and no cards; seed any cards a test needs with `addCard`.
 */
export async function createBoard(page: Page): Promise<string> {
  await page.goto("/")
  await page.getByRole("button", { name: "Create a board" }).click()
  await page.waitForURL(/\/d\/board-/)
  return new URL(page.url()).pathname.split("/d/")[1]
}

/** The deck header, told apart from every other header by its "⋯" menu. */
function deckHeader(page: Page) {
  return page.locator("header", {
    has: page.getByRole("button", { name: "Board actions" }),
  })
}

/**
 * The open board's title in the deck header — an inline-editable span (it flips
 * to an input on click), not a heading. Scoped to the deck header so it isn't
 * confused with the same board name in the sidebar.
 */
export function boardTitle(page: Page, name: string) {
  return deckHeader(page).getByText(name, { exact: true })
}

/** Opens the deck header's "⋯" menu — reorder and delete live there. */
export async function openBoardMenu(page: Page): Promise<void> {
  await deckHeader(page).getByRole("button", { name: "Board actions" }).click()
  await expect(menu(page, "Board actions")).toBeVisible()
}

/**
 * Opens the share dialog from the deck header's own Share button. Its label
 * carries the board's current reach ("Share: Private"), so match on the prefix.
 */
export async function openShare(page: Page): Promise<void> {
  await deckHeader(page)
    .getByRole("button", { name: /^Share: / })
    .click()
  await expect(page.getByRole("heading", { name: "Share" })).toBeVisible()
}

/**
 * Renames the open board via its header title (an inline-editable span that
 * flips to an input on click) and waits for the new name to show.
 */
export async function renameBoard(
  page: Page,
  fromName: string,
  toName: string
): Promise<void> {
  await boardTitle(page, fromName).click()
  const input = page.getByRole("textbox", { name: "Board name" })
  await input.fill(toName)
  await input.press("Enter")
  await expect(boardTitle(page, toName)).toBeVisible()
}

/**
 * Deletes the open board from its "⋯" menu, confirming the "are you sure?"
 * dialog. The confirm click is scoped: the menu item shares its name.
 */
export async function deleteBoard(page: Page): Promise<void> {
  await openBoardMenu(page)
  await page.getByRole("menuitem", { name: "Delete board" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete board" })
    .click()
}

/** Opens the board named `name` from the sidebar's dashboards list. */
export async function openBoardInSidebar(
  page: Page,
  name: string
): Promise<void> {
  await page.getByRole("button", { name }).click()
  await expect(boardTitle(page, name)).toBeVisible()
}

export async function toggleSort(page: Page, label: string): Promise<void> {
  await expect(async () => {
    await openBoardMenu(page)
    await menu(page, "Board actions")
      .getByRole("menuitem", { name: "Sort cards" })
      .hover({ timeout: 2000 })
    await menu(page, "Sort cards")
      .getByRole("menuitem", { name: label })
      .click({ timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  await page.keyboard.press("Escape")
}

/**
 * The sync indicator (a floating button at the bottom-right of the board). Its
 * accessible name *is* the current status ("Synced", "1 change", "2 changes",
 * "Sync failed", "Offline"), so a test reads status straight off the locator's
 * accessible name. (While syncing the label is "Syncing" — but tests assert the
 * settled states.)
 */
export function syncIndicator(page: Page) {
  // Anchored: the sidebar's account row is a button too, and its name ends in
  // the same words ("e2e Offline") once the connection drops.
  return page.getByRole("button", {
    name: /^(Synced|\d+ changes?|Sync failed|Offline)$/,
  })
}

/* -------------------------------------------------------------------------- */
/*  Second-client board ops — drive the board list channel from a teammate.    */
/* -------------------------------------------------------------------------- */

/**
 * Another client creates a board, so it should appear in the open page's sidebar
 * list even though the page never opens it. Returns the new board's id.
 */
export async function remoteCreateDashboard(
  request: APIRequestContext,
  title: string
): Promise<string> {
  const id = `board-${crypto.randomUUID().slice(0, 8)}`
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "dashboards",
        record: {
          id,
          title,
          position: "a5",
          sort: [],
          updatedAt: Date.now(),
          deletedAt: null,
        },
      },
    ],
  })
  return id
}

/** Reads board `id` off the server — the record a remote write has to build on. */
async function readDashboard(
  request: APIRequestContext,
  id: string
): Promise<Dashboard> {
  const { changes } = await dashboardSync(request, { since: 0, changes: [] })
  const hit = changes.find((c) => c.record.id === id)
  if (!hit) throw new Error(`board ${id} not found on the server`)
  return hit.record
}

/** Another client renames the board titled `fromTitle`. */
export async function remoteRenameDashboard(
  request: APIRequestContext,
  id: string,
  toTitle: string
): Promise<void> {
  const existing = await readDashboard(request, id)
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "dashboards",
        record: {
          ...existing,
          title: toTitle,
          updatedAt: newerThan(existing),
        },
      },
    ],
  })
}

/** Another client deletes the board `id` (tombstones it on the list channel). */
export async function remoteDeleteDashboard(
  request: APIRequestContext,
  id: string
): Promise<void> {
  const existing = await readDashboard(request, id)
  const at = newerThan(existing)
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "dashboards",
        record: { ...existing, deletedAt: at, updatedAt: at },
      },
    ],
  })
}

/** Polls until the server reports board `id` as deleted (its tombstone landed). */
export async function waitForDashboardDeleted(
  request: APIRequestContext,
  id: string,
  timeoutMs = 8000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { changes } = await dashboardSync(request, { since: 0, changes: [] })
    const hit = changes.find((c) => c.record.id === id)
    if (hit && hit.record.deletedAt != null) return
    if (Date.now() > deadline)
      throw new Error(
        `timed out waiting for board ${id} to be deleted on the server`
      )
    await new Promise((r) => setTimeout(r, 150))
  }
}
