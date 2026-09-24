import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  cardTitled,
  column,
  columnCardTitles,
  createBoard,
  editCardBody,
  fieldText,
  openCard,
  panelField,
  retitleCard,
} from "../helpers"

// Type with pressSequentially, not fill: the `#` menu opens on typed input.
async function boardWithCards(page: Page, cards: Record<string, string>) {
  await createBoard(page)
  for (const [title, body] of Object.entries(cards)) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
    if (body) await editCardBody(page, title, body)
  }
}

function tagChip(page: Page, cardTitle: string, tag: string) {
  return cardTitled(page, cardTitle).getByTitle(`Show cards tagged #${tag}`)
}

function filterPill(page: Page, tag: string) {
  return page.getByRole("button", { name: `Clear #${tag} filter` })
}

// Column order depends on insertion, which isn't what these tests are about.
async function visibleTitles(page: Page): Promise<string[]> {
  return (await columnCardTitles(page, "To Do")).sort()
}

function tagMenuRows(page: Page): Locator {
  return page.getByRole("option", { name: /^#/ })
}

function color(target: Locator): Promise<string> {
  return target.evaluate(
    (element) =>
      element.ownerDocument.defaultView!.getComputedStyle(element).color
  )
}

test.describe("card tags", () => {
  test("renders a #tag in the body as a chip, but not inside code", async ({
    page,
  }) => {
    await boardWithCards(page, { Alpha: "ship #real and `#code` too" })

    await expect(tagChip(page, "Alpha", "real")).toBeVisible()
    await expect(tagChip(page, "Alpha", "code")).toHaveCount(0)
    await expect(cardTitled(page, "Alpha").getByText("#code")).toBeVisible()
  })

  test("clicking a tag filters the board to cards carrying it", async ({
    page,
  }) => {
    await boardWithCards(page, {
      Alpha: "#urgent fix",
      Beta: "later #urgent",
      Gamma: "#someday",
    })

    await tagChip(page, "Alpha", "urgent").click()

    // The chip sits inside the card, but clicking it filters, not opens.
    await expect(panelField(page, "Title")).toHaveCount(0)
    await expect(filterPill(page, "urgent")).toBeVisible()
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha", "Beta"])
  })

  test("adding cards is off while filtered, since a new card wouldn't match", async ({
    page,
  }) => {
    await boardWithCards(page, { Alpha: "#urgent" })

    await tagChip(page, "Alpha", "urgent").click()

    await expect(filterPill(page, "urgent")).toBeVisible()
    await expect(
      column(page, "To Do").getByRole("button", { name: "Add card to To Do" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Add card", exact: true })
    ).toHaveCount(0)
  })

  test("the pill clears the filter", async ({ page }) => {
    await boardWithCards(page, { Alpha: "#urgent", Beta: "" })

    await tagChip(page, "Alpha", "urgent").click()
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha"])

    await filterPill(page, "urgent").click()

    await expect(filterPill(page, "urgent")).toHaveCount(0)
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha", "Beta"])
    await expect(
      column(page, "To Do").getByRole("button", { name: "Add card to To Do" })
    ).toBeVisible()
  })

  test("clicking the same tag again clears it", async ({ page }) => {
    await boardWithCards(page, { Alpha: "#urgent", Beta: "" })

    await tagChip(page, "Alpha", "urgent").click()
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha"])

    await tagChip(page, "Alpha", "urgent").click()

    await expect(filterPill(page, "urgent")).toHaveCount(0)
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha", "Beta"])
  })

  test("two tags narrow to cards carrying both", async ({ page }) => {
    await boardWithCards(page, {
      Alpha: "#urgent #backend",
      Beta: "#urgent",
      Gamma: "#backend",
    })

    await tagChip(page, "Alpha", "urgent").click()
    await tagChip(page, "Alpha", "backend").click()

    await expect(filterPill(page, "urgent")).toBeVisible()
    await expect(filterPill(page, "backend")).toBeVisible()
    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha"])
  })

  test("the filter ignores case", async ({ page }) => {
    await boardWithCards(page, {
      Alpha: "#Urgent",
      Beta: "#urgent",
      Gamma: "",
    })

    await tagChip(page, "Beta", "urgent").click()

    await expect.poll(() => visibleTitles(page)).toEqual(["Alpha", "Beta"])
  })

  test("the # menu offers the board's tags, most used first, and leaves out the card being edited", async ({
    page,
  }) => {
    await boardWithCards(page, {
      Alpha: "#rare #common",
      Beta: "#common",
      Source: "#mine",
    })

    await openCard(page, "Source")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.press("End")
    await notes.pressSequentially(" #")

    const rows = tagMenuRows(page)
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText("#common")
    await expect(rows.nth(0)).toContainText("2 cards")
    await expect(rows.nth(1)).toContainText("#rare")
    await expect(rows.nth(1)).toContainText("1 card")
  })

  test("picking a tag from the menu inserts it with a trailing space", async ({
    page,
  }) => {
    await boardWithCards(page, { Alpha: "#urgent", Source: "" })

    await openCard(page, "Source")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("fix #urg")

    await page.getByRole("option", { name: /^#urgent/ }).click()

    await expect.poll(() => fieldText(notes)).toBe("fix #urgent ")
  })

  test("a bare # opening a line is left to be a heading", async ({ page }) => {
    await boardWithCards(page, { Alpha: "#urgent", Source: "" })

    await openCard(page, "Source")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("#")

    await expect(tagMenuRows(page)).toHaveCount(0)

    // Once a letter follows, it can only be a tag.
    await notes.pressSequentially("u")
    await expect(page.getByRole("option", { name: /^#urgent/ })).toBeVisible()
  })

  test("the slash menu's Tag command starts a tag", async ({ page }) => {
    await boardWithCards(page, { Source: "" })

    await openCard(page, "Source")
    const notes = panelField(page, "Notes")
    await notes.click()
    await notes.pressSequentially("fix /tag")

    await page.getByRole("option", { name: /^Tag/ }).click()

    await expect.poll(() => fieldText(notes)).toBe("fix #")
  })

  test("the editor colors a tag apart from the text around it", async ({
    page,
  }) => {
    await boardWithCards(page, { Source: "" })

    await openCard(page, "Source")
    const notes = panelField(page, "Notes")
    await notes.fill("plain #urgent")

    const tag = notes.locator("span", { hasText: /^#urgent$/ })
    await expect(tag).toHaveCount(1)
    expect(await color(tag)).not.toBe(await color(notes))
  })
})
