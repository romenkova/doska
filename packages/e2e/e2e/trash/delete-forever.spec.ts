import { test, expect, type Page } from "@playwright/test"
import { RETENTION_MS } from "@doska/contract"
import {
  addCard,
  authenticate,
  cardTitled,
  createBoard,
  deleteColumn,
  deleteForeverFromTrash,
  openTrash,
  renameColumn,
  retitleCard,
  serverCard,
  signIn,
  trashEntry,
  waitForChange,
} from "../helpers"

// The trash spans the account and the e2e server is shared across retries.
const uniq = (name: string) => `${name} ${crypto.randomUUID().slice(0, 8)}`

async function deleteCard(page: Page, title: string) {
  await cardTitled(page, title)
    .getByRole("button", { name: "Card actions" })
    .click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await expect(cardTitled(page, title)).toHaveCount(0)
}

test.describe("delete forever", () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page)
    await authenticate(request)
  })

  test("asks first, and the card stays gone after a reload", async ({
    page,
  }) => {
    await createBoard(page)
    const title = uniq("Shred me")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
    await deleteCard(page, title)

    await openTrash(page)
    await trashEntry(page, title)
      .getByRole("button", { name: "Delete" })
      .click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel" })
      .click()
    await expect(trashEntry(page, title)).toBeVisible()

    await deleteForeverFromTrash(page, title)

    await page.reload()
    await expect(page.getByRole("heading", { name: "Trash" })).toBeVisible()
    await expect(trashEntry(page, title)).toHaveCount(0)
  })

  test("reaches the server as expired, the column and its cards alike", async ({
    page,
    request,
  }) => {
    const boardId = await createBoard(page)
    const columnName = uniq("Shred column")
    const cardTitle = uniq("Passenger")
    await renameColumn(page, "To Do", columnName)
    await addCard(page, columnName)
    await retitleCard(page, "Untitled card", cardTitle)
    await waitForChange(request, boardId, "cards", cardTitle)

    await deleteColumn(page, columnName)
    await openTrash(page)
    await deleteForeverFromTrash(page, columnName)

    // Past retention, so the server's own sweep will drop them.
    const cutoff = Date.now() - RETENTION_MS
    // Trash pulls every board in the shared account first; the push queues behind it.
    const timeout = 20_000
    await expect
      .poll(
        async () => {
          const column = await waitForChange(
            request,
            boardId,
            "columns",
            columnName
          )
          return column.record.deletedAt ?? Infinity
        },
        { timeout }
      )
      .toBeLessThan(cutoff)
    await expect
      .poll(
        async () =>
          (await serverCard(request, boardId, cardTitle))?.deletedAt ??
          Infinity,
        { timeout }
      )
      .toBeLessThan(cutoff)
  })
})
