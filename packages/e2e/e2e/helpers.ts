import { expect, type APIRequestContext, type Page } from "@playwright/test"
import type { Change, DashboardChange } from "@deck/contract"

/**
 * The single credential pair the e2e API server is booted with (see
 * playwright.config). Sync is gated behind it; local editing is not.
 */
export const TEST_CREDENTIALS = { login: "e2e", password: "e2e-secret" }

/**
 * Signs the open page in through the UI so its background sync is authorized —
 * the same steps a user takes: the sidebar's sign-in control, then the modal.
 * The sign-in control only appears once the session check resolves to
 * signed-out, which Playwright auto-waits for.
 */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/")
  // `exact` so this picks the sign-in control, not the account row that wraps it
  // (whose accessible name also ends in "Sign in to sync").
  await page.getByRole("button", { name: "Sign in to sync", exact: true }).click()
  await page.getByPlaceholder("Login").fill(TEST_CREDENTIALS.login)
  await page.getByPlaceholder("Password").fill(TEST_CREDENTIALS.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByPlaceholder("Login")).toBeHidden()
}

/**
 * Authorizes a raw request context (the simulated second client) by logging in
 * over the API, so its direct `/rpc` calls are accepted.
 */
export async function authenticate(request: APIRequestContext): Promise<void> {
  const res = await request.post("/auth/login", { data: TEST_CREDENTIALS })
  if (!res.ok())
    throw new Error(`e2e login failed (${res.status()}): ${await res.text()}`)
}

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

/**
 * The sync indicator in the header. Its accessible name *is* the current status
 * ("All changes saved", "1 unsaved change", "Saving...", "Sync failed"), so a
 * test reads status straight off the locator's accessible name.
 */
export function syncIndicator(page: Page) {
  return page.getByRole("button", {
    name: /saved|unsaved|Saving|Sync failed/,
  })
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

/**
 * Calls the dashboard-list sync RPC — the board-independent channel that carries
 * the dashboard list. Same `{ json }` envelope as the board channel.
 */
async function dashboardSync(
  request: APIRequestContext,
  body: { since: number; changes: DashboardChange[] }
): Promise<{ cursor: number; changes: DashboardChange[] }> {
  const res = await request.post("/rpc/dashboards/sync", {
    data: { json: body },
  })
  if (!res.ok())
    throw new Error(`dashboard sync failed (${res.status()}): ${await res.text()}`)
  const payload = (await res.json()) as {
    json: { cursor: number; changes: DashboardChange[] }
  }
  return payload.json
}

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
          // A strictly newer clock so the rename wins last-writer-wins.
          updatedAt: Date.now() + 10_000,
          deletedAt: null,
        },
      },
    ],
  })
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
