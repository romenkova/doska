import { expect, type APIRequestContext, type Page } from "@playwright/test"
import type { Change } from "@doska/contract"
import { sync, waitForChange } from "./rpc"
import { column } from "./column"

/* -------------------------------------------------------------------------- */
/*  Card helpers. Cards are addressed by their visible title; bodies are the   */
/*  text a user reads, never the markdown source or markup.                    */
/* -------------------------------------------------------------------------- */

/**
 * A card on the board, located by its visible title. Scoped to the draggable so
 * it never collides with the modal editor's title field, which is a `<textarea>`
 * holding the same text — a bare `getByText(title)` matches both while the modal
 * is open (or mid-close), so always reach for the board card through this.
 */
export function card(page: Page, title: string) {
  return page.locator("[data-rfd-draggable-id]", { hasText: title })
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

/**
 * Opens the card titled `fromTitle` in the modal editor, retitles it to
 * `toTitle`, saves, and waits for the board to show the new title.
 */
export async function retitleCard(
  page: Page,
  fromTitle: string,
  toTitle: string
): Promise<void> {
  await card(page, fromTitle).click()
  const title = page.getByPlaceholder("Title")
  await expect(title).toBeFocused()
  await title.fill(toTitle)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(card(page, toTitle)).toBeVisible()
}

/**
 * Opens the card titled `title` in the modal editor and waits for it to be
 * editable (the title input takes focus). Pair with `editCardBody` /
 * `retitleCard`, or drive the modal directly for lock/preview tests.
 */
export async function openCard(page: Page, title: string): Promise<void> {
  await card(page, title).click()
  await expect(page.getByPlaceholder("Title")).toBeFocused()
}

/**
 * Opens the card titled `title`, replaces its body (the "Notes" field) with
 * `body`, then saves — closing the modal back to the board. Waits on the editor
 * closing rather than on any particular rendered text, so it stays agnostic to
 * how the body renders on the card.
 */
export async function editCardBody(
  page: Page,
  title: string,
  body: string
): Promise<void> {
  await openCard(page, title)
  await page.getByPlaceholder("Notes").fill(body)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByPlaceholder("Notes")).toBeHidden()
}

/**
 * Keyboard-drags the card titled `title`: focus it, Space to lift, the given
 * moves (e.g. "ArrowDown"/"ArrowRight"), Space to drop. The card element is its
 * own drag handle. Small pauses let @hello-pangea/dnd's async lift/move settle
 * between keypresses — without them the lift can be missed and the move no-ops.
 */
export async function dragCardByTitle(
  page: Page,
  title: string,
  moves: string[]
): Promise<void> {
  await card(page, title).focus()
  await page.keyboard.press("Space")
  await page.waitForTimeout(250) // wait for the lift to register
  for (const move of moves) {
    await page.keyboard.press(move)
    await page.waitForTimeout(250)
  }
  await page.keyboard.press("Space")
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
          locked: false,
          position: "a5",
          columnId: col.record.id,
          deadline: null,
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
    // A strictly newer clock so the edit wins last-writer-wins.
    changes: [
      {
        store: "cards",
        record: { ...target.record, title: toTitle, updatedAt: Date.now() + 10_000 },
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
  await sync(request, {
    boardId,
    since: 0,
    changes: [
      {
        store: "cards",
        record: {
          ...target.record,
          deletedAt: Date.now(),
          updatedAt: Date.now() + 10_000,
        },
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
