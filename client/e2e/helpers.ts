import { expect, type Page } from "@playwright/test"

/** localStorage key the sync layer persists its pending dirty refs under. */
export const DIRTY_KEY = "deck:sync:dirty"

/**
 * Creates a fresh board from Home and returns its generated deck id. Tests use
 * this to set up their own board rather than navigating to a seeded id like
 * `/d/product`, which is a first-run fixture that may not exist (e.g. once the
 * seed data changes or a real backend stops seeding it).
 *
 * A new board lands with the four default columns (To Do / In Progress / Done
 * / Paused) and no cards; seed any cards a test needs with `addCard`.
 */
export async function createBoard(page: Page): Promise<string> {
  await page.goto("/")
  await page.getByRole("button", { name: "Create a board" }).click()
  await page.waitForURL(/\/d\/board-/)
  return new URL(page.url()).pathname.split("/d/")[1]
}

/**
 * Adds a card to the named column and resolves once it has rendered. New cards
 * seed with the "Untitled card" fallback title, so this waits on that count
 * rising rather than on a specific title.
 */
export async function addCard(page: Page, column: string): Promise<void> {
  const seeded = page.getByText("Untitled card")
  const before = await seeded.count()
  await page.getByRole("button", { name: `Add card to ${column}` }).click()
  await expect(seeded).toHaveCount(before + 1)
}

/**
 * Reads the persisted dirty refs out of the page's localStorage. Tolerates a
 * missing or malformed value (returns `[]`) so it can be polled across the
 * window where the app has recovered in memory but not yet rewritten storage.
 */
export async function readDirty(page: Page): Promise<string[]> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), DIRTY_KEY)
  try {
    const parsed = JSON.parse(raw ?? "[]")
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

/**
 * Reads all keys of an IndexedDB object store from inside the page. Used to
 * assert on the durable store directly (e.g. that a delete actually cascaded),
 * not just what the UI happens to render.
 */
export function idbKeys(page: Page, store: string): Promise<string[]> {
  return page.evaluate(
    (storeName) =>
      new Promise<string[]>((resolve, reject) => {
        const req = indexedDB.open("deck")
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(storeName, "readonly")
          const r = tx.objectStore(storeName).getAllKeys()
          r.onsuccess = () => {
            resolve(r.result as string[])
            db.close()
          }
          r.onerror = () => reject(r.error)
        }
        req.onerror = () => reject(req.error)
      }),
    store
  )
}

/** Reads a single record from an IndexedDB object store inside the page. */
export function idbGet<T>(page: Page, store: string, key: string): Promise<T> {
  return page.evaluate(
    ({ storeName, recordKey }) =>
      new Promise<T>((resolve, reject) => {
        const req = indexedDB.open("deck")
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(storeName, "readonly")
          const r = tx.objectStore(storeName).get(recordKey)
          r.onsuccess = () => {
            resolve(r.result as T)
            db.close()
          }
          r.onerror = () => reject(r.error)
        }
        req.onerror = () => reject(req.error)
      }),
    { storeName: store, recordKey: key }
  )
}

/** A card on the board, located by its visible title. */
export function card(page: Page, title: string) {
  return page.locator("[data-rfd-draggable-id]", { hasText: title })
}

/** Ordered list of card titles currently rendered in a column. */
export async function columnTitles(
  page: Page,
  columnId: string
): Promise<string[]> {
  return page
    .locator(`[data-rfd-droppable-id="${columnId}"] [data-slot="card-title"]`)
    .allInnerTexts()
}

/**
 * Performs a keyboard drag of one card: focus its handle, Space to lift, the
 * given moves (e.g. "ArrowDown"/"ArrowRight"), Space to drop. Small pauses let
 * @hello-pangea/dnd's async lift/move lifecycle settle between keypresses —
 * without them the lift can be missed and the move silently no-ops.
 */
export async function keyboardDrag(
  page: Page,
  draggableId: string,
  moves: string[]
): Promise<void> {
  await page.locator(`[data-rfd-drag-handle-draggable-id="${draggableId}"]`).focus()
  await page.keyboard.press("Space")
  await page.waitForTimeout(250) // wait for the lift to register
  for (const move of moves) {
    await page.keyboard.press(move)
    await page.waitForTimeout(250)
  }
  await page.keyboard.press("Space")
  await page.waitForTimeout(350) // wait out the drop animation
}

/** Column ids on the board, left-to-right, read from the dnd markup. */
export function columnIds(page: Page): Promise<string[]> {
  return page
    .locator("[data-rfd-droppable-id]")
    .evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-rfd-droppable-id")!)
    )
}

/** Ordered card ids within a column, read from the dnd markup. */
export function cardIds(page: Page, columnId: string): Promise<string[]> {
  return page
    .locator(`[data-rfd-droppable-id="${columnId}"] [data-rfd-draggable-id]`)
    .evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-rfd-draggable-id")!)
    )
}
