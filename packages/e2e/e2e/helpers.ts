import { expect, type APIRequestContext, type Page } from "@playwright/test"
import type { Change } from "@deck/contract"

/* -------------------------------------------------------------------------- */
/*  UI helpers — everything tests touch is what a user sees: board names, card */
/*  titles, column names. No entity ids, IndexedDB, or sync-internal storage.  */
/* -------------------------------------------------------------------------- */

/**
 * Creates a fresh board from Home and returns its generated deck id (read off
 * the URL — the one identifier a user can actually see, in their address bar).
 * A new board lands with the four default columns (To Do / In Progress / Done /
 * Paused) and no cards; seed any cards a test needs with `addCard`.
 */
export async function createBoard(page: Page): Promise<string> {
  await page.goto("/")
  await page.getByRole("button", { name: "Create a board" }).click()
  await page.waitForURL(/\/d\/board-/)
  return new URL(page.url()).pathname.split("/d/")[1]
}

/**
 * Adds a card to the named column. New cards seed with the "Untitled card"
 * fallback title, so this waits on that count rising rather than on a specific
 * title; pair with `retitleCard` to give it a distinct name.
 */
export async function addCard(page: Page, column: string): Promise<void> {
  const seeded = page.getByText("Untitled card")
  const before = await seeded.count()
  await page.getByRole("button", { name: `Add card to ${column}` }).click()
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
  await page.getByText(fromTitle).click()
  const title = page.getByPlaceholder("Title")
  await expect(title).toBeFocused()
  await title.fill(toTitle)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText(toTitle)).toBeVisible()
}

/** A card on the board, located by its visible title. */
export function card(page: Page, title: string) {
  return page.locator("[data-rfd-draggable-id]", { hasText: title })
}

/** A column, located by its accessible name (its visible heading). */
export function column(page: Page, name: string) {
  return page.getByRole("group", { name })
}

/** The card titles rendered in a named column, top to bottom. */
export function columnCardTitles(page: Page, name: string): Promise<string[]> {
  return column(page, name).locator('[data-slot="card-title"]').allInnerTexts()
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
/*  Sync helpers — drive a *second* client (another device/teammate) straight  */
/*  against the server so the open page reconciles a change it never made.     */
/*  Specs speak in titles and column names; the entity ids stay in here.       */
/* -------------------------------------------------------------------------- */

/**
 * Calls the sync RPC. oRPC wraps payloads in a `{ json }` envelope on the wire;
 * this hides that. The relative URL resolves against the config baseURL, which
 * proxies `/rpc` to the e2e sync server.
 */
async function sync(
  request: APIRequestContext,
  body: { boardId: string; since: number; changes: Change[] }
): Promise<{ cursor: number; changes: Change[] }> {
  const res = await request.post("/rpc/board/sync", { data: { json: body } })
  if (!res.ok())
    throw new Error(`sync failed (${res.status()}): ${await res.text()}`)
  const payload = (await res.json()) as {
    json: { cursor: number; changes: Change[] }
  }
  return payload.json
}

/**
 * Polls the server until a change the open page pushed shows up, then returns
 * it. Lets a test reference "the card titled X" or "the To Do column" without
 * waiting on or knowing about the client's push timing.
 */
async function waitForChange<S extends Change["store"]>(
  request: APIRequestContext,
  boardId: string,
  store: S,
  title: string,
  timeoutMs = 8000
): Promise<Extract<Change, { store: S }>> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { changes } = await sync(request, { boardId, since: 0, changes: [] })
    const hit = changes.find(
      (c): c is Extract<Change, { store: S }> =>
        c.store === store && c.record.title === title
    )
    if (hit) return hit
    if (Date.now() > deadline)
      throw new Error(`timed out waiting for ${store} "${title}" on the server`)
    await new Promise((r) => setTimeout(r, 150))
  }
}

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
