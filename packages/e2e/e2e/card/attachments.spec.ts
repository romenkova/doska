import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  attachmentRow,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  PNG,
  signIn,
} from "../helpers"

async function attachFile(page: Page, name: string): Promise<void> {
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: PNG })
  await expect(
    page.getByRole("button", { name: "Attach", exact: true })
  ).toBeVisible()
}

/**
 * These upload through the real `/api/files` route to whatever storage the
 * server is configured with — a temp dir here (see playwright.config), the
 * mounted volume in a container run. Nothing is stubbed, so a broken storage
 * backend fails these.
 */
test.describe("card attachments", { tag: "@container" }, () => {
  test("Attach is disabled until signed in", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await expect(
      cardPanel(page).getByRole("button", { name: "Attach", exact: true })
    ).toBeDisabled()
  })

  test("uploading a file renders its row and tile", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "diagram.png")

    await expect(cardPanel(page).getByText("diagram")).toBeVisible()
    await expect(attachmentRow(page, "diagram.png")).toBeVisible()
  })

  test("clicking an image attachment in readonly view opens the viewer", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await editCardBody(page, "Untitled card", "Some notes")

    // Body is non-empty, so the panel opens in preview (readonly) this time.
    await card(page, "Some notes").click()
    await expect(cardPanel(page)).toBeVisible()

    await attachFile(page, "photo.png")
    await expect(attachmentRow(page, "photo.png")).toBeVisible()

    await attachmentRow(page, "photo.png").getByText("photo.png").click()

    const viewer = page.getByRole("dialog")
    await expect(viewer.getByRole("img", { name: "photo.png" })).toBeVisible()
    await viewer.getByRole("button", { name: "Close" }).click()
    await expect(viewer).toHaveCount(0)
  })

  test("the stored bytes come back through the server, and are gone after a remove", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    // The upload response carries the key storage minted — the one handle to
    // the blob, so the round trip is asserted against it rather than the UI.
    const upload = page.waitForResponse(
      (res) =>
        res.url().endsWith("/api/files") && res.request().method() === "POST"
    )
    await attachFile(page, "roundtrip.png")
    const { key } = (await (await upload).json()) as { key: string }
    expect(key).toMatch(/^att\/[0-9a-f-]{36}\.png$/)

    const url = `/api/files/${key}`
    const stored = await page.request.get(url)
    expect(stored.status()).toBe(200)
    // Byte-for-byte: anything that mangles the blob on the way to disk or back
    // still renders as *an* image, so comparing the bytes is the real check.
    expect(Buffer.from(await stored.body()).equals(PNG)).toBe(true)
    expect(stored.headers()["x-content-type-options"]).toBe("nosniff")
    expect(stored.headers()["content-type"]).toBe("image/png")

    await page.getByRole("button", { name: "Remove attachment" }).click()
    await expect(cardPanel(page).getByText("roundtrip")).toHaveCount(0)

    await expect
      .poll(async () => (await page.request.get(url)).status(), {
        message: `blob ${key} still readable after the attachment was removed`,
      })
      .toBe(404)
  })

  test("removing an attachment removes its row", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "notes.png")
    await expect(attachmentRow(page, "notes.png")).toBeVisible()

    await page.getByRole("button", { name: "Remove attachment" }).click()
    await expect(attachmentRow(page, "notes.png")).toHaveCount(0)
  })
})
