import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  retitleCard,
} from "../helpers"

/**
 * The card body is GFM markdown rendered in the panel's read-only preview.
 * These assert on the rendered DOM (semantic elements / roles), scoped to
 * `cardPanel`, never on the markdown source — so a renderer refactor that
 * keeps the same output keeps these green.
 */
test.describe("card markdown rendering", () => {
  test("headings render at their level", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Headings")
    await editCardBody(page, "Headings", "# Big title\n\n## Smaller title")

    await card(page, "Headings").click()
    const panel = cardPanel(page)
    await expect(
      panel.getByRole("heading", { level: 1, name: "Big title" })
    ).toBeVisible()
    await expect(
      panel.getByRole("heading", { level: 2, name: "Smaller title" })
    ).toBeVisible()
  })

  test("bold, italic and inline code render in their own elements", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Inline styles")
    await editCardBody(
      page,
      "Inline styles",
      "This is **bold**, this is *italic*, and this is `code`."
    )

    await card(page, "Inline styles").click()
    const panel = cardPanel(page)
    await expect(panel.locator("strong", { hasText: "bold" })).toBeVisible()
    await expect(panel.locator("em", { hasText: "italic" })).toBeVisible()
    await expect(panel.locator("code", { hasText: "code" })).toBeVisible()
  })

  test("ordered and unordered lists render as lists", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Lists")
    await editCardBody(
      page,
      "Lists",
      "1. First\n2. Second\n\n- Apples\n- Oranges"
    )

    await card(page, "Lists").click()
    const panel = cardPanel(page)
    await expect(panel.getByRole("list")).toHaveCount(2)
    // Chromium leaves <li>'s accessible name empty (no name-from-content for
    // listitem), so filter on rendered text rather than getByRole's name option.
    const items = panel.getByRole("listitem")
    await expect(items.filter({ hasText: "First" })).toBeVisible()
    await expect(items.filter({ hasText: "Second" })).toBeVisible()
    await expect(items.filter({ hasText: "Apples" })).toBeVisible()
    await expect(items.filter({ hasText: "Oranges" })).toBeVisible()
  })

  test("a link renders with the correct href", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Link")
    await editCardBody(
      page,
      "Link",
      "See the [docs](https://example.com/docs) for more."
    )

    await card(page, "Link").click()
    const link = cardPanel(page).getByRole("link", { name: "docs" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "https://example.com/docs")
  })

  test("a fenced code block renders inside pre/code", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Code block")
    await editCardBody(
      page,
      "Code block",
      "```js\nconst answer = 42\n```"
    )

    await card(page, "Code block").click()
    await expect(
      cardPanel(page).locator("pre code", { hasText: "const answer = 42" })
    ).toBeVisible()
  })

  test("a blockquote renders as a blockquote", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Quote")
    await editCardBody(page, "Quote", "> A wise observation")

    await card(page, "Quote").click()
    await expect(
      cardPanel(page).locator("blockquote", { hasText: "A wise observation" })
    ).toBeVisible()
  })

  test("a GFM table renders with headers and cells", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Table")
    await editCardBody(
      page,
      "Table",
      "| Name | Qty |\n| --- | --- |\n| Apples | 3 |\n| Pears | 5 |"
    )

    await card(page, "Table").click()
    const panel = cardPanel(page)
    await expect(panel.getByRole("table")).toBeVisible()
    await expect(panel.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(panel.getByRole("columnheader", { name: "Qty" })).toBeVisible()
    await expect(panel.getByRole("cell", { name: "Apples" })).toBeVisible()
    await expect(panel.getByRole("cell", { name: "5" })).toBeVisible()
  })

  test("an image renders with its alt text", async ({ page }) => {
    await page.route("https://example.com/pic.png", async (route) => {
      await route.fulfill({ status: 200, contentType: "image/png", body: Buffer.alloc(0) })
    })

    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Image")
    await editCardBody(page, "Image", "![A nice picture](https://example.com/pic.png)")

    await card(page, "Image").click()
    await expect(
      cardPanel(page).getByRole("img", { name: "A nice picture" })
    ).toBeVisible()
  })
})
