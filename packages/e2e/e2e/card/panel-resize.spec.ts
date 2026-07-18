import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard } from "../helpers"

const WIDTH_KEY = "deck.cardPanelWidth"
const DEFAULT_WIDTH = "448"

function storedWidth(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), WIDTH_KEY)
}

// dx is pixels; negative drags left, widening the panel. Wait out the open transition first — the handle's box moves during it.
async function dragResizeHandle(page: Page, dx: number): Promise<void> {
  const handle = page.getByRole("separator", { name: "Resize card panel" })
  await page.waitForTimeout(300)
  const box = await handle.boundingBox()
  if (!box) throw new Error("resize handle has no layout box")

  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + dx, y, { steps: 10 })
  await page.mouse.up()
}

// Width is the only part of the resize a test can assert without measuring a CSS transition's pixels.
test.describe("card panel resize", () => {
  test("dragging the handle persists the new width, double-click resets it", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await dragResizeHandle(page, -150)

    await expect.poll(() => storedWidth(page)).not.toBe(DEFAULT_WIDTH)
    expect(Number(await storedWidth(page))).toBeGreaterThan(Number(DEFAULT_WIDTH))

    await page
      .getByRole("separator", { name: "Resize card panel" })
      .dblclick()
    await expect.poll(() => storedWidth(page)).toBe(DEFAULT_WIDTH)
  })

  test("the persisted width survives a reload", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await dragResizeHandle(page, -100)

    await expect.poll(() => storedWidth(page)).not.toBe(DEFAULT_WIDTH)
    const dragged = await storedWidth(page)

    await page.reload()
    await expect(storedWidth(page)).resolves.toBe(dragged)
  })
})
