import { expect, type Page } from "@playwright/test"
import { openBoardMenu } from "./board"

/* -------------------------------------------------------------------------- */
/*  Column helpers. Columns are addressed by their visible heading (their      */
/*  accessible name), and the order asserted is the left-to-right order a user */
/*  sees — never positions or ids.                                            */
/* -------------------------------------------------------------------------- */

/** A column, located by its accessible name (its visible heading). */
export function column(page: Page, name: string) {
  return page.getByRole("group", { name })
}

/** The board's column names, left to right — the order a user sees. */
export function boardColumnNames(page: Page): Promise<string[]> {
  return page
    .getByRole("group")
    .evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label") ?? "")
    )
}

/** The card titles rendered in a named column, top to bottom. */
export function columnCardTitles(page: Page, name: string): Promise<string[]> {
  return column(page, name).locator('[data-slot="card-title"]').allInnerTexts()
}

/**
 * Adds a column via the "+" standing after the last column. New columns land
 * with the "New column" fallback title, appended after the existing ones; this
 * waits for it to render. Pair with `renameColumn` to give it a distinct name.
 */
export async function addColumn(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Add column" }).click()
  await expect(column(page, "New column")).toBeVisible()
}

/**
 * Renames the column titled `fromTitle` in place — its heading flips to an
 * inline input on click, same as the board name — and waits for the column to
 * show the new name.
 */
export async function renameColumn(
  page: Page,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  await column(page, fromTitle).getByText(fromTitle).click()
  const input = page.getByRole("textbox", { name: `Rename ${fromTitle}` })
  await input.fill(toTitle)
  await input.press("Enter")
  await expect(column(page, toTitle)).toBeVisible()
}

/** Opens the named column's "⋯" menu — its color, done flag and delete live there. */
export async function openColumnMenu(page: Page, name: string): Promise<void> {
  // A menu from the previous call stays in the DOM while it animates closed.
  await expect(page.getByRole("menu")).toHaveCount(0)
  await column(page, name).getByRole("button", { name: `${name} actions` }).click()
  await expect(page.getByRole("menu")).toBeVisible()
}

/**
 * A column's color dot in its header. Its accessible name carries the color set
 * ("Column color: Violet", or "…: No color"), the same thing a user sees.
 */
export function columnColorSwatch(page: Page, name: string) {
  return column(page, name).getByRole("img", { name: /^Column color:/ })
}

/** Sets the named column's color by picking `colorLabel` from its "⋯" menu. */
export async function setColumnColor(
  page: Page,
  name: string,
  colorLabel: string
): Promise<void> {
  await openColumnMenu(page, name)
  await page.getByRole("menuitem", { name: "Color" }).click()
  await page.getByRole("menuitem", { name: colorLabel, exact: true }).click()
  await expect(columnColorSwatch(page, name)).toHaveAccessibleName(
    `Column color: ${colorLabel}`
  )
}

/** The badge marking the board's done column. It renders only while the flag is on. */
export function columnDoneBadge(page: Page, name: string) {
  return column(page, name).getByLabel(`${name} is the done column`)
}

/** Toggles the named column's "done" flag from its "⋯" menu and waits for the badge to follow. */
export async function setColumnDone(
  page: Page,
  name: string,
  done: boolean
): Promise<void> {
  await openColumnMenu(page, name)
  await page
    .getByRole("menuitem", {
      name: done ? "Mark cards as done" : "Unmark cards as done",
    })
    .click()
  await expect(columnDoneBadge(page, name)).toHaveCount(done ? 1 : 0)
}

/**
 * Deletes the column titled `title` from its "⋯" menu, confirming the "are you
 * sure?" dialog. The confirm click is scoped: the menu item shares its name.
 */
export async function deleteColumn(page: Page, title: string): Promise<void> {
  await openColumnMenu(page, title)
  await page.getByRole("menuitem", { name: "Delete column" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete column" })
    .click()
  await expect(column(page, title)).toHaveCount(0)
}

/**
 * Opens the "Reorder columns" modal, keyboard-drags the column block titled
 * `title` (the blocks list vertically, so use ArrowUp/ArrowDown), drops it, and
 * closes the modal. Same lift/move/drop dance as `dragCardByTitle`, with pauses
 * for @hello-pangea/dnd to settle.
 */
export async function reorderColumn(
  page: Page,
  title: string,
  moves: string[]
): Promise<void> {
  await openBoardMenu(page)
  await page.getByRole("menuitem", { name: "Reorder columns" }).click()
  const block = page
    .getByRole("dialog")
    .locator("[data-rfd-drag-handle-draggable-id]", { hasText: title })
  await block.focus()
  await page.keyboard.press("Space")
  await page.waitForTimeout(250)
  for (const move of moves) {
    await page.keyboard.press(move)
    await page.waitForTimeout(250)
  }
  await page.keyboard.press("Space")
  await page.waitForTimeout(350)
  // Close with Escape rather than the "Done" button: a column can itself be
  // named "Done", which would collide with the button's accessible name.
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
}
