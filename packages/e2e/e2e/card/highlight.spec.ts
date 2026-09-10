import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  createBoard,
  openCard,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * While editing, the body's markup is styled in place: delimiters dim and the
 * text they mark up takes on the weight or slant they stand for. Each styled run
 * is its own `span` inside the field, so the assertions read those.
 */
async function cardWithNotes(page: Page, body: string) {
  await createBoard(page)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Highlighted")
  await openCard(page, "Highlighted")

  const notes = panelField(page, "Notes")
  await notes.fill(body)
  return notes
}

function color(target: Locator): Promise<string> {
  return target.evaluate(
    (element) =>
      element.ownerDocument.defaultView!.getComputedStyle(element).color
  )
}

test.describe("editor syntax highlighting", () => {
  test("styles the markup in its own runs, leaving the text one flow", async ({
    page,
  }) => {
    const notes = await cardWithNotes(page, "# Title with **bold**")

    // The delimiters are painted apart from what they mark up.
    await expect(notes.locator("span", { hasText: /^\*\*$/ })).toHaveCount(2)
    await expect(notes.locator("span", { hasText: /^bold$/ })).toHaveCount(1)
  })

  test("dims the delimiters and weights the text they mark up", async ({
    page,
  }) => {
    const notes = await cardWithNotes(page, "plain **bold**")

    const delimiter = notes.locator("span", { hasText: /^\*\*$/ }).first()
    expect(await color(delimiter)).not.toBe(await color(notes))
    await expect(notes.locator("span", { hasText: /^bold$/ })).toHaveCSS(
      "font-weight",
      "600"
    )
  })

  test("dims a ticked task's text", async ({ page }) => {
    const notes = await cardWithNotes(
      page,
      "- [x] a ticked task\n- [ ] an open one"
    )

    const done = notes.locator(".cm-done")
    await expect(done).toHaveCount(1)
    await expect(done).toHaveText("a ticked task")
  })

  test("dims the -cut- line", async ({ page }) => {
    const notes = await cardWithNotes(page, "above\n\n-cut-\n\nbelow")

    await expect(notes.locator(".cm-cut")).toHaveText("-cut-")
  })

  test("leaves the title field unstyled, so only the body carries markup", async ({
    page,
  }) => {
    await cardWithNotes(page, "# Title with **bold**")

    // The title is a plain field: what's typed there stays one unbroken run.
    const title = panelField(page, "Title")
    await title.fill("# Title with **bold**")
    await expect(title.locator("span")).toHaveCount(0)
  })
})
