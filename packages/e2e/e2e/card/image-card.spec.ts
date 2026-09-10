import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  attachmentRow,
  card,
  cardPanel,
  closeCard,
  createBoard,
  editCardBody,
  fieldText,
  openCard,
  panelField,
  pngDataTransfer,
  retitleCard,
  signIn,
} from "../helpers"

/** The board card showing the image named `alt` — the whole card is that image. */
function imageCard(page: Page, alt: string) {
  return page
    .locator("[data-rfd-draggable-id]")
    .filter({ has: page.getByRole("img", { name: alt }) })
}

/**
 * Attaches `<base>.png` to the open card and makes it the card's entire body,
 * through the slash command that inserts an attached image — the cross-browser
 * way to get an image ref into the notes (a paste carries no files in firefox).
 * Leaves the card saved and the panel closed.
 */
async function bodyOfOneImage(page: Page, base: string): Promise<void> {
  const name = `${base}.png`
  const notes = panelField(page, "Notes")
  const transfer = await pngDataTransfer(page, name)

  await notes.dispatchEvent("drop", { dataTransfer: transfer })
  await expect(attachmentRow(page, name)).toBeVisible()

  await notes.click()
  await notes.pressSequentially(`/${base}`)
  await page.getByRole("option", { name: `${name} Insert image` }).click()
  await expect
    .poll(() => fieldText(notes))
    .toMatch(new RegExp(`^!\\[${name}\\]\\(.+\\)$`))

  await closeCard(page)
  await expect(panelField(page, "Notes")).toHaveCount(0)
}

/**
 * A card that amounts to one image is drawn as that image, edge to edge: no
 * fallback title, no attachment row, no padding around it. Uploads go to the
 * real storage backend, so these only run where files work.
 */
test.describe("image-only cards", { tag: "@container" }, () => {
  test("a body that is only an image ref renders as the image alone", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)

    await addCard(page, "To Do")
    await card(page, "Untitled card").click()
    await bodyOfOneImage(page, "poster")

    const shown = imageCard(page, "poster.png")
    await expect(shown).toBeVisible()

    // The fallback title and the attachment's filename row are both gone — the
    // image is the card.
    await expect(shown.getByText("Untitled card")).toHaveCount(0)
    await expect(shown.getByText("poster.png")).toHaveCount(0)
  })

  test("a lone image attachment with no body renders the same way", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const transfer = await pngDataTransfer(page, "scan.png")
    await panelField(page, "Notes").dispatchEvent("drop", {
      dataTransfer: transfer,
    })
    await expect(cardPanel(page).getByText("scan")).toBeVisible()
    await closeCard(page)
    await expect(panelField(page, "Notes")).toHaveCount(0)

    // Nothing was written into the body, so the attachment itself is the card.
    const shown = imageCard(page, "scan.png")
    await expect(shown).toBeVisible()
    await expect(shown.getByText("Untitled card")).toHaveCount(0)
    await expect(shown.getByText("scan.png")).toHaveCount(0)
  })

  test("the ⋯ menu still works on an untitled image card", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()
    await bodyOfOneImage(page, "chart")

    const shown = imageCard(page, "chart.png")
    await shown.getByRole("button", { name: "Card actions" }).click()
    await page.getByRole("menuitem", { name: "Delete" }).click()

    await expect(shown).toHaveCount(0)
  })

  test("a titled image card keeps its title", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Launch poster")

    await openCard(page, "Launch poster")
    await bodyOfOneImage(page, "launch")

    const shown = imageCard(page, "launch.png")
    await expect(shown.getByText("Launch poster")).toBeVisible()
  })

  test("hiding a column's bodies leaves the image showing", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Notes card")
    await editCardBody(page, "Notes card", "Decision: ship it")

    await addCard(page, "To Do")
    await card(page, "Untitled card").click()
    await bodyOfOneImage(page, "banner")

    await page.getByRole("button", { name: "Hide body in To Do" }).click()
    await expect(
      page.getByRole("button", { name: "Show body in To Do" })
    ).toBeVisible()

    // The image card has nothing else to show, so the collapse leaves it alone.
    // (The collapsed text body is only clipped, never unmounted — see body.spec.)
    await expect(imageCard(page, "banner.png")).toBeVisible()
  })
})
