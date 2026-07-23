import { test } from "@playwright/test"
import { addCard, cardTitled, createBoard, retitleCard } from "../helpers"

const TITLES = [
  "Ship the deadline index",
  "Review Anya's sync patch",
  "Write up the postmortem",
  "Renew the TLS certificate before it lapses",
]
const DUE = ["2026-07-23", "2026-07-23", "2026-07-25", "2026-07-28"]

/** Scratch spec: renders a populated digest and screenshots it. Not an assertion. */
test("screenshot the digest", async ({ page }) => {
  test.setTimeout(120_000)
  await createBoard(page)

  for (const title of TITLES) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
  }

  // The native date input only renders below the 768px breakpoint.
  await page.setViewportSize({ width: 500, height: 900 })
  for (let i = 0; i < TITLES.length; i++) {
    await cardTitled(page, TITLES[i]).locator('input[type="date"]').fill(DUE[i])
  }

  await page.goto("/digest")
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "digest-shot.png", fullPage: true })
})
