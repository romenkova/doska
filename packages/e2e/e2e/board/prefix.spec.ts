import { test, expect } from "@playwright/test"
import { addCard, cardIdButton, createBoard, prefixChip, signIn } from "../helpers"

// A fresh board's prefix is derived from its title ("Untitled board" -> "UB"), suffixed to stay unique.
test.describe("board prefix", () => {
  test("renaming the prefix relabels existing card ids", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")

    // Signed-in tests share one server, so the derived prefix isn't fixed — read
    // it back, and rename to a unique target so a retry can't collide server-side.
    const idButton = cardIdButton(page)
    await expect(idButton).toBeVisible()
    const current = (await idButton.getAttribute("aria-label"))!
      .replace("Copy card id ", "")
      .split("-")[0]
    const target = "Z" + Math.random().toString(36).slice(2, 6).toUpperCase()

    await prefixChip(page, current).click()
    const input = page.getByRole("textbox", { name: "Board prefix" })
    await input.fill(target)
    await input.press("Enter")

    await expect(prefixChip(page, target)).toBeVisible()
    await expect(cardIdButton(page)).toHaveAttribute(
      "aria-label",
      `Copy card id ${target}-1`
    )
  })

  test("rejects a prefix already used by another board", async ({ page }) => {
    await createBoard(page)
    await createBoard(page)
    await expect(prefixChip(page, "UB2")).toBeVisible()

    await prefixChip(page, "UB2").click()
    const input = page.getByRole("textbox", { name: "Board prefix" })
    await input.fill("UB")
    await input.press("Enter")

    await expect(page.getByRole("alert")).toHaveText("UB is taken")
    // Rejected: still editing, not reverted back to the chip.
    await expect(input).toBeVisible()
  })

  test("Escape cancels the edit", async ({ page }) => {
    await createBoard(page)
    await prefixChip(page, "UB").click()

    const input = page.getByRole("textbox", { name: "Board prefix" })
    await input.fill("ZZZZ")
    await input.press("Escape")

    await expect(prefixChip(page, "UB")).toBeVisible()
  })
})
