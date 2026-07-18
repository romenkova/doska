import { test, expect } from "@playwright/test"
import { addCard, cardIdButton, createBoard, signIn } from "../helpers"

// The id chip only appears once the server stamps a number on sync, so these need a signed-in board.
test.describe("card id", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] })

  test("copies the card id to the clipboard", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")

    const idButton = cardIdButton(page)
    await expect(idButton).toBeVisible()
    const id = (await idButton.getAttribute("aria-label"))?.replace(
      "Copy card id ",
      ""
    )
    expect(id).toMatch(/^[A-Z0-9]+-\d+$/)

    await idButton.click()

    // navigator.clipboard is on the real page, not Node's ambient Navigator type.
    const clipboard = await page.evaluate(() =>
      (navigator as Navigator & { clipboard: { readText(): Promise<string> } })
        .clipboard.readText()
    )
    expect(clipboard).toBe(id)
  })

  test("the click doesn't also open the card", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")

    await expect(cardIdButton(page)).toBeVisible()
    await cardIdButton(page).click()
    await expect(page).not.toHaveURL(/\/c\//)
  })
})
