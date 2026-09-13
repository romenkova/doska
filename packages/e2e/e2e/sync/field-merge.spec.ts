import { test, expect, type Browser, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  closeCard,
  createBoard,
  editCardBody,
  openBoardInSidebar,
  openCard,
  panelField,
  renameBoard,
  retitleCard,
  setDeadline,
  signIn,
  syncIndicator,
} from "../helpers"

const TITLE = "Merge me"
const BASE = "line one\nline two"

function weekOut() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const sameYear = year === new Date().getFullYear()
  return sameYear ? `${day}.${month}` : `${day}.${month}.${year}`
}

/**
 * A board with one card to merge on, named so a second device can pick it out
 * of a sidebar every parallel worker fills with "Untitled board".
 */
async function boardWithCard(page: Page): Promise<string> {
  const name = `Merge ${Date.now()}-${Math.floor(Math.random() * 1000)}`
  await createBoard(page)
  await renameBoard(page, "Untitled board", name)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", TITLE)
  await editCardBody(page, TITLE, BASE)
  await expect(syncIndicator(page)).toHaveAccessibleName("Synced")
  return name
}

/**
 * A second device on the same account, opened on the board. Opened from the
 * sidebar rather than by URL: a link to a board the device has not pulled yet
 * bounces back to Home.
 */
async function secondDevice(browser: Browser, board: string): Promise<Page> {
  const page = await browser.newContext().then((c) => c.newPage())
  await signIn(page)
  await openBoardInSidebar(page, board)
  await expect(card(page, TITLE)).toBeVisible()
  await expect(syncIndicator(page)).toHaveAccessibleName("Synced")
  return page
}

// Closed with Escape from the Title field rather than the header button: the
// offline toast can land over the panel, and the Notes editor swallows Escape.
async function editBodyOffline(page: Page, body: string): Promise<void> {
  await openCard(page, TITLE)
  await panelField(page, "Notes").fill(body)
  await panelField(page, "Title").click()
  await page.keyboard.press("Escape")
  await page.waitForURL((url) => !url.pathname.includes("/c/"))
}

async function setOffline(pages: Page[], offline: boolean): Promise<void> {
  for (const page of pages) await page.context().setOffline(offline)
  const name = offline ? "Offline" : "Synced"
  for (const page of pages) {
    await expect(syncIndicator(page)).toHaveAccessibleName(name, {
      timeout: 15_000,
    })
  }
}

function marker(page: Page) {
  return card(page, TITLE).getByLabel("Edit conflict")
}

/**
 * Two devices editing one card while both are offline. Everything else about
 * the merge is unit and integration tested; these two are the user-visible
 * outcomes.
 */
test.describe("field merge across devices", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test("a body edit and a deadline made apart both survive", async ({
    page,
    browser,
  }) => {
    const other = await secondDevice(browser, await boardWithCard(page))
    // The deadline picker is a lazy chunk and this harness blocks the service
    // worker that precaches it, so load it once before going offline.
    await setDeadline(other, TITLE, "No deadline")
    await expect(syncIndicator(other)).toHaveAccessibleName("Synced")

    await setOffline([page, other], true)
    await editBodyOffline(page, "line one\nline two\nline three")
    await setDeadline(other, TITLE, "In a week")
    await setOffline([page, other], false)

    for (const device of [page, other]) {
      await expect(card(device, TITLE)).toContainText("line three", {
        timeout: 10_000,
      })
      await expect(card(device, TITLE).getByText(weekOut())).toBeVisible()
      await expect(marker(device)).toHaveCount(0)
    }
    await other.context().close()
  })

  test("the same line edited twice marks a conflict Use theirs settles", async ({
    page,
    browser,
  }) => {
    const other = await secondDevice(browser, await boardWithCard(page))

    await setOffline([page, other], true)
    await editBodyOffline(page, "line one from here\nline two")
    await editBodyOffline(other, "line one from there\nline two")
    await setOffline([page, other], false)

    await expect(marker(page)).toBeVisible({ timeout: 10_000 })
    await expect(marker(other)).toBeVisible({ timeout: 10_000 })

    await openCard(page, TITLE)
    await cardPanel(page).getByRole("button", { name: "Use theirs" }).click()
    await closeCard(page)

    await expect(marker(page)).toHaveCount(0)
    await expect(marker(other)).toHaveCount(0, { timeout: 10_000 })
    // Which side won depends on whose edit stamped later, so compare the two.
    const settled = await card(page, TITLE).getByRole("paragraph").innerText()
    await expect(card(other, TITLE)).toContainText(settled, {
      timeout: 10_000,
    })
    await other.context().close()
  })
})
