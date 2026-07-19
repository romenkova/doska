import { expect, type APIRequestContext, type Page } from "@playwright/test"
import { derivePrefix } from "@doska/contract"
import { dashboardSync } from "./rpc"

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

/**
 * The open board's title in the deck header — an inline-editable span (it flips
 * to an input on click), not a heading. Scoped to the header carrying the "Add
 * column" control so it isn't confused with the same board name in the sidebar.
 */
export function boardTitle(page: Page, name: string) {
  return page
    .locator("header", { has: page.getByRole("button", { name: "Add column" }) })
    .getByText(name, { exact: true })
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
 * Deletes the open board via its header trash action, then confirms the "are you
 * sure?" dialog. The dialog's confirm button shares the "Delete board" name with
 * the header trigger, so the confirm click is scoped to the dialog.
 */
export async function deleteBoard(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Delete board" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete board" })
    .click()
}

/** The board's card-id prefix chip in the header; its accessible name is the prefix text. */
export function prefixChip(page: Page, prefix: string) {
  return page
    .locator("header", { has: page.getByRole("button", { name: "Add column" }) })
    .getByRole("button", { name: prefix, exact: true })
}

/** Opens the board named `name` from the sidebar's dashboards list. */
export async function openBoardInSidebar(
  page: Page,
  name: string
): Promise<void> {
  await page.getByRole("button", { name }).click()
  await expect(boardTitle(page, name)).toBeVisible()
}

/**
 * The sync indicator (a floating button at the bottom-right of the board). Its
 * accessible name *is* the current status ("Synced", "1 change", "2 changes",
 * "Sync failed", "Offline"), so a test reads status straight off the locator's
 * accessible name. (While syncing the label is "Syncing" — but tests assert the
 * settled states.)
 */
export function syncIndicator(page: Page) {
  return page.getByRole("button", {
    name: /Synced|change|Sync failed|Offline/,
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
          prefix: derivePrefix(title),
          updatedAt: Date.now(),
          deletedAt: null,
        },
      },
    ],
  })
  return id
}

/** Another client renames the board titled `fromTitle`. */
export async function remoteRenameDashboard(
  request: APIRequestContext,
  id: string,
  toTitle: string
): Promise<void> {
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "dashboards",
        record: {
          id,
          title: toTitle,
          position: "a5",
          prefix: derivePrefix(toTitle),
          // A strictly newer clock so the rename wins last-writer-wins.
          updatedAt: Date.now() + 10_000,
          deletedAt: null,
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
  await dashboardSync(request, {
    since: 0,
    changes: [
      {
        store: "dashboards",
        record: {
          id,
          title: "",
          position: "a5",
          prefix: "",
          deletedAt: Date.now(),
          // A strictly newer clock so the delete wins last-writer-wins.
          updatedAt: Date.now() + 10_000,
        },
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
      throw new Error(`timed out waiting for board ${id} to be deleted on the server`)
    await new Promise((r) => setTimeout(r, 150))
  }
}
