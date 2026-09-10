import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard, fieldText, panelField } from "../helpers"

/**
 * IDE-style cut: ⌘X with nothing selected takes the whole line the caret is on,
 * clipboard included. With a selection, only the selection is cut.
 */
async function openNotesWith(page: Page, lines: string[]) {
  await createBoard(page)
  await addCard(page, "To Do")
  await card(page, "Untitled card").click()
  const notes = panelField(page, "Notes")
  await notes.click()
  for (const [i, line] of lines.entries()) {
    if (i > 0) await notes.press("Enter")
    await notes.pressSequentially(line)
  }
  await expect.poll(() => fieldText(notes)).toBe(lines.join("\n"))
  return notes
}

test.describe("cut line", () => {
  test("cuts the line the caret sits on", async ({ page }) => {
    const notes = await openNotesWith(page, ["one", "two", "three"])

    // Caret is at the end of the last line. The line break before it isn't
    // part of the line, so cutting the last line leaves an empty one behind.
    await notes.press("ControlOrMeta+x")

    await expect.poll(() => fieldText(notes)).toBe("one\ntwo\n")
  })

  test("cuts a middle line and closes the gap", async ({ page }) => {
    const notes = await openNotesWith(page, ["one", "two", "three"])

    await notes.press("ArrowUp")
    await notes.press("ControlOrMeta+x")

    await expect.poll(() => fieldText(notes)).toBe("one\nthree")
  })

  // Playwright only recognises the clipboard permissions in chromium — firefox
  // and webkit reject `clipboard-read` at context creation — so reading the
  // clipboard back is checked there only. The cut itself is checked everywhere.
  test.describe("clipboard contents", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "clipboard permissions are chromium-only"
    )
    test.use({ permissions: ["clipboard-read", "clipboard-write"] })

    test("the cut line lands on the clipboard", async ({ page }) => {
      const notes = await openNotesWith(page, ["one", "two", "three"])

      await notes.press("ArrowUp")
      await notes.press("ControlOrMeta+x")

      // navigator.clipboard is on the real page, not Node's ambient Navigator type.
      const clipboard = await page.evaluate(() =>
        (
          navigator as Navigator & {
            clipboard: { readText(): Promise<string> }
          }
        ).clipboard.readText()
      )
      // No trailing newline: the editor remembers the cut was linewise and
      // pastes it back as a line of its own.
      expect(clipboard).toBe("two")
    })
  })

  test("a selection cuts only what's selected", async ({ page }) => {
    const notes = await openNotesWith(page, ["one", "two three"])

    // Select " three" only — the native cut should take just that, not the line.
    for (let i = 0; i < " three".length; i++)
      await notes.press("Shift+ArrowLeft")
    await notes.press("ControlOrMeta+x")

    await expect.poll(() => fieldText(notes)).toBe("one\ntwo")
  })
})
