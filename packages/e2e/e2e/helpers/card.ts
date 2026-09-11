import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test"
import type { Change } from "@doska/contract"
import { newerThan, sync, waitForChange } from "./rpc"
import { column } from "./column"
import { menu } from "./menu"

/* -------------------------------------------------------------------------- */
/*  Card helpers. Cards are addressed by their visible title; bodies are the   */
/*  text a user reads, never the markdown source or markup.                    */
/* -------------------------------------------------------------------------- */

/**
 * A card on the board, located by its visible title. Scoped to the draggable so
 * it never collides with the modal editor's title field, which holds the same
 * text — a bare `getByText(title)` matches both while the modal
 * is open (or mid-close), so always reach for the board card through this.
 *
 * Matches anything the card renders, body included — several specs locate a
 * card by a phrase in its notes. That means a card whose body references
 * another card matches that card's title too; reach for `cardTitled` when the
 * distinction matters.
 */
export function card(page: Page, title: string) {
  return page.locator("[data-rfd-draggable-id]", { hasText: title })
}

/** A card matched on its title alone, ignoring whatever its body renders. */
export function cardTitled(page: Page, title: string) {
  return page.locator("[data-rfd-draggable-id]").filter({
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  })
}

/**
 * The display id ("12") of the card titled `title`, read off its search result
 * — the one place the app still prints it. Only exists once the server has
 * stamped the card a number, so the board must be signed in.
 */
export async function cardDisplayId(
  page: Page,
  title: string
): Promise<string> {
  await page.getByRole("button", { name: "Search cards" }).click()
  const input = page.getByPlaceholder("Search cards")
  await input.fill(title)

  const row = page.getByRole("option").filter({ hasText: title }).first()
  // The number arrives on a sync round-trip, which the default expect timeout
  // can lose to under a loaded parallel run.
  await expect(row).toContainText(/#\d+/, { timeout: 15_000 })
  const [, id] = /#(\d+)/.exec((await row.textContent()) ?? "") ?? []

  await page.keyboard.press("Escape")
  await expect(input).toBeHidden()
  return id
}

/**
 * A `[[…]]` reference rendered inside a card body, located by the title of the
 * card it points at — the same text a user reads in the reference.
 */
export function cardRef(page: Page, toTitle: string) {
  return page.getByRole("link").filter({ hasText: toTitle })
}

// Scope panel content through this — the board card behind the panel renders the same title/body.
export function cardPanel(page: Page) {
  return page.getByRole("region", { name: "Card" })
}

/**
 * The panel's Title or Notes field. Title is a textarea; Notes is a CodeMirror
 * contenteditable named after its placeholder, so `fill`, `press` and
 * `pressSequentially` work on both but `toHaveValue` only on Title — read
 * either back through `fieldText`.
 */
export function panelField(page: Page, name: "Title" | "Notes") {
  return page.getByRole("textbox", { name, exact: true })
}

// Runs in the page; Node has no DOM lib, so only the members used are typed.
// `cmTile` is the handle CodeMirror leaves on its content element — the same
// one `EditorView.findFromDOM` walks.
interface CmContent {
  cmTile: {
    root: {
      view: { state: { doc: { toString(): string } } }
    }
  }
}
interface TextField {
  value: string
}

/**
 * The markdown a panel field holds, newlines included. Read off the editor
 * rather than the DOM: the DOM splits lines into blocks and shows the
 * placeholder as text when the field is empty.
 */
export function fieldText(field: Locator): Promise<string> {
  return field.evaluate((el: CmContent | TextField) =>
    "value" in el ? el.value : el.cmTile.root.view.state.doc.toString()
  )
}

/**
 * Adds a card to the named column via the column's "add card" control, which now
 * lives as a full-width button at the top of the column body (it used to sit in
 * the column header). New cards have an empty title and render the "Untitled
 * card" fallback on the board, so this waits on that count rising rather than on
 * a specific title; pair with `retitleCard` to give it a distinct name.
 */
export async function addCard(page: Page, name: string): Promise<void> {
  const seeded = card(page, "Untitled card")
  const before = await seeded.count()
  await column(page, name)
    .getByRole("button", { name: `Add card to ${name}` })
    .click()
  await expect(seeded).toHaveCount(before + 1)
}

// Reopening before the panel unmounts reuses the stale instance, so wait it fully out, not just off the route.
async function waitForPanelToClose(page: Page): Promise<void> {
  await page.waitForURL((url) => !url.pathname.includes("/c/"))
  await expect(panelField(page, "Title")).toHaveCount(0)
}

/**
 * Closes the card panel. Edits autosave on a debounce and closing flushes what
 * is still queued, so this is how a spec commits a panel edit — the panel has
 * no Save button.
 */
export async function closeCard(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Close card" }).click()
  await waitForPanelToClose(page)
}

/**
 * Opens the card titled `fromTitle` in the panel editor, retitles it to
 * `toTitle`, closes the panel, and waits for the board to show the new title.
 */
export async function retitleCard(
  page: Page,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  await openCard(page, fromTitle)
  await panelField(page, "Title").fill(toTitle)
  await closeCard(page)
  await expect(card(page, toTitle)).toBeVisible()
}

/**
 * Opens the card titled `title` and ensures it's in the editor (title input
 * focused). A card with a body opens read-only, so we click the "Edit" toggle
 * to enter the editor; an empty card opens straight in the editor already. Pair
 * with `editCardBody` / `retitleCard`, or drive the panel directly for preview
 * tests.
 */
export async function openCard(page: Page, title: string): Promise<void> {
  await card(page, title).click()
  await expect(cardPanel(page)).toBeVisible()
  if (await page.getByRole("button", { name: "Edit" }).isVisible()) {
    await page.getByRole("button", { name: "Edit" }).click()
  }
  // Click to focus: a panel reused mid-close-animation won't refire the field's autoFocus.
  const titleField = panelField(page, "Title")
  await titleField.click()
  await expect(titleField).toBeFocused()
}

/**
 * Opens the card titled `title`, replaces its body (the "Notes" field) with
 * `body`, then closes the panel back to the board.
 */
export async function editCardBody(
  page: Page,
  title: string,
  body: string
): Promise<void> {
  await openCard(page, title)
  await panelField(page, "Notes").fill(body)
  await closeCard(page)
}

/** The priority trigger/chip on the board card titled `title`. */
export function cardPriorityButton(page: Page, title: string) {
  return card(page, title).getByRole("button", { name: "Card priority" })
}

/** The priority chip's accessible label ("Priority: High"), or null when unset. */
export function cardPriorityLabel(page: Page, title: string) {
  return card(page, title).locator('[aria-label^="Priority:"]')
}

export async function openCardMenu(page: Page, title: string): Promise<void> {
  await cardTitled(page, title)
    .getByRole("button", { name: "Card actions" })
    .click()
  await expect(menu(page, "Card actions")).toBeVisible()
}

export async function setCardPriority(
  page: Page,
  title: string,
  label: string
): Promise<void> {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "Priority", exact: true })
    .click()
  await menu(page, "Priority").getByRole("menuitem", { name: label }).click()
  await expect(menu(page, "Card actions")).toBeHidden()
}

export type DeadlinePreset = "No deadline" | "Today" | "Tomorrow" | "In a week"

export async function setDeadline(
  page: Page,
  title: string,
  preset: DeadlinePreset
): Promise<void> {
  await openCardMenu(page, title)
  await menu(page, "Card actions")
    .getByRole("menuitem", { name: "Deadline", exact: true })
    .click()
  await menu(page, "Deadline")
    .getByRole("menuitem", { name: preset, exact: true })
    .click()
  await expect(menu(page, "Card actions")).toBeHidden()
}

/** What @hello-pangea/dnd announces to screen readers as a drag progresses. */
function dragAnnouncement(page: Page, text: RegExp) {
  return page.locator('[id^="rfd-announcement-"]').filter({ hasText: text })
}

/**
 * Keyboard-drags the card titled `title`: focus it, Space to lift, the given
 * moves (e.g. "ArrowDown"/"ArrowRight"), Space to drop. The card element is its
 * own drag handle. The lift and the drop are async, so each waits on dnd's own
 * announcement — a fixed pause lets a slow lift through and the drag no-ops.
 */
export async function dragCardByTitle(
  page: Page,
  title: string,
  moves: string[]
): Promise<void> {
  await card(page, title).focus()
  await page.keyboard.press("Space")
  await expect(dragAnnouncement(page, /have lifted an item/)).toHaveCount(1)
  for (const move of moves) {
    await page.keyboard.press(move)
    await page.waitForTimeout(250)
  }
  await page.keyboard.press("Space")
  await expect(dragAnnouncement(page, /have dropped the item/)).toHaveCount(1)
  await page.waitForTimeout(350) // wait out the drop animation
}

/* -------------------------------------------------------------------------- */
/*  Second-client card ops — drive a teammate's card edits over the API.       */
/* -------------------------------------------------------------------------- */

/** Another client adds a card to the named column. */
export async function remoteAddCard(
  request: APIRequestContext,
  boardId: string,
  columnName: string,
  title: string
): Promise<void> {
  const col = await waitForChange(request, boardId, "columns", columnName)
  await sync(request, {
    boardId,
    since: 0,
    changes: [
      {
        store: "cards",
        record: {
          id: `card-${crypto.randomUUID().slice(0, 8)}`,
          title,
          body: "",
          position: "a5",
          columnId: col.record.id,
          number: null,
          deadline: null,
          priority: "",
          attachments: [],
          updatedAt: Date.now(),
          deletedAt: null,
        },
      },
    ],
  })
}

/** Another client retitles the card currently titled `fromTitle`. */
export async function remoteEditCard(
  request: APIRequestContext,
  boardId: string,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  const target = await waitForChange(request, boardId, "cards", fromTitle)
  await sync(request, {
    boardId,
    since: 0,
    changes: [
      {
        store: "cards",
        record: {
          ...target.record,
          title: toTitle,
          updatedAt: newerThan(target.record),
        },
      },
    ],
  })
}

/** Another client deletes the card titled `title`. */
export async function remoteDeleteCard(
  request: APIRequestContext,
  boardId: string,
  title: string
): Promise<void> {
  const target = await waitForChange(request, boardId, "cards", title)
  const at = newerThan(target.record)
  await sync(request, {
    boardId,
    since: 0,
    changes: [
      {
        store: "cards",
        record: { ...target.record, deletedAt: at, updatedAt: at },
      },
    ],
  })
}

/**
 * Reads the card titled `title` straight off the server (tombstones included),
 * or null if it never shows up — letting a test assert on its stored
 * `deletedAt` rather than on what the UI happens to render.
 */
export async function serverCard(
  request: APIRequestContext,
  boardId: string,
  title: string,
  timeoutMs = 8000
): Promise<Extract<Change, { store: "cards" }>["record"] | null> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { changes } = await sync(request, { boardId, since: 0, changes: [] })
    const hit = changes.find(
      (c): c is Extract<Change, { store: "cards" }> =>
        c.store === "cards" && c.record.title === title
    )
    if (hit) return hit.record
    if (Date.now() > deadline) return null
    await new Promise((r) => setTimeout(r, 150))
  }
}
