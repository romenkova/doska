import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  signIn,
} from "../helpers"

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64"
)

/**
 * The real server 503s without S3 configured, so every test mocks the
 * `/api/files` routes the client's `S3FileStorage` talks to. Must be
 * registered before the action that triggers the request.
 */
async function mockFileRoutes(page: Page): Promise<void> {
  let uploads = 0
  await page.route("**/api/files", async (route) => {
    uploads += 1
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        key: `att/${uploads}.png`,
        mime: "image/png",
        size: PNG.length,
      }),
    })
  })
  await page.route("**/api/files/**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: "image/png", body: PNG })
  })
}

async function attachFile(page: Page, name: string): Promise<void> {
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: PNG })
  await expect(
    page.getByRole("button", { name: "Attach", exact: true })
  ).toBeVisible()
}

test.describe("card attachments", () => {
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
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "diagram.png")

    await expect(cardPanel(page).getByText("diagram")).toBeVisible()
    await expect(
      cardPanel(page).getByRole("button", { name: "diagram.png" })
    ).toBeVisible()
  })

  test("clicking an image attachment in readonly view opens the viewer", async ({
    page,
  }) => {
    await signIn(page)
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await editCardBody(page, "Untitled card", "Some notes")

    // Body is non-empty, so the panel opens in preview (readonly) this time.
    await card(page, "Some notes").click()
    await expect(cardPanel(page)).toBeVisible()

    await attachFile(page, "photo.png")
    await expect(cardPanel(page).getByText("photo")).toBeVisible()

    await cardPanel(page).getByText("photo").click()

    const viewer = page.getByRole("dialog")
    await expect(viewer.getByRole("img", { name: "photo.png" })).toBeVisible()
    await viewer.getByRole("button", { name: "Close" }).click()
    await expect(viewer).toHaveCount(0)
  })

  test("removing an attachment removes its row", async ({ page }) => {
    await signIn(page)
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "notes.png")
    await expect(cardPanel(page).getByText("notes")).toBeVisible()

    await page.getByRole("button", { name: "Remove attachment" }).click()
    await expect(cardPanel(page).getByText("notes")).toHaveCount(0)
  })
})
