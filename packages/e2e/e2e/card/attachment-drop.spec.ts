import { test, expect } from "@playwright/test"
import {
  addCard,
  attachmentRow,
  card,
  cardPanel,
  createBoard,
  fieldText,
  panelField,
  pasteInto,
  pngDataTransfer,
  signIn,
} from "../helpers"

/**
 * The two ways to attach a file that aren't the Attach button: dragging it onto
 * the card body, and pasting it into the notes. Neither can be driven through a
 * file input, so each test hands the page a real `DataTransfer` and dispatches
 * the same event the browser would.
 */
test.describe("dropping and pasting files", { tag: "@container" }, () => {
  test("dropping a file on the card body attaches it", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    const transfer = await pngDataTransfer(page, "dropped.png")

    await notes.dispatchEvent("dragenter", { dataTransfer: transfer })
    await expect(page.getByText("Drop files to attach")).toBeVisible()

    await notes.dispatchEvent("drop", { dataTransfer: transfer })

    await expect(page.getByText("Drop files to attach")).toHaveCount(0)
    await expect(cardPanel(page).getByText("dropped")).toBeVisible()
    await expect(attachmentRow(page, "dropped.png")).toBeVisible()
  })

  test("a drop while signed out says so instead of failing silently", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    const transfer = await pngDataTransfer(page, "nope.png")

    await notes.dispatchEvent("dragenter", { dataTransfer: transfer })
    await expect(page.getByText("Attachments unavailable")).toBeVisible()

    await notes.dispatchEvent("drop", { dataTransfer: transfer })

    await expect(page.getByText("Sign in to attach files")).toBeVisible()
    await expect(cardPanel(page).getByText("nope")).toHaveCount(0)
  })

  // Firefox drops the files from a ClipboardEvent built in the page: the event
  // keeps its `clipboardData`, but the DataTransfer arrives with zero files, so
  // there is nothing for the paste handler to attach.
  test.describe("paste", () => {
    test.skip(
      ({ browserName }) => browserName === "firefox",
      "synthetic ClipboardEvent carries no files in firefox"
    )

    test("pasting an image attaches it and writes the markdown at the caret", async ({
      page,
    }) => {
      await signIn(page)
      await createBoard(page)
      await addCard(page, "To Do")
      await card(page, "Untitled card").click()

      const notes = panelField(page, "Notes")
      await notes.click()
      await notes.pressSequentially("before")

      const transfer = await pngDataTransfer(page, "pasted.png")
      await pasteInto(notes, transfer)

      // The upload lands as an image reference spliced in where the caret was...
      await expect
        .poll(() => fieldText(notes))
        .toMatch(/^before!\[pasted\.png\]\(.+\)$/)
      // ...and as an attachment on the card. (Matched on the tile: the notes now
      // carry the same name, so plain text would be ambiguous.)
      await expect(attachmentRow(page, "pasted.png")).toBeVisible()
    })
  })

  test("an attached image is offered as a slash command", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = panelField(page, "Notes")
    const transfer = await pngDataTransfer(page, "chart.png")
    await notes.dispatchEvent("drop", { dataTransfer: transfer })
    await expect(attachmentRow(page, "chart.png")).toBeVisible()

    await notes.click()
    await notes.pressSequentially("/chart")

    const command = page.getByRole("option", {
      name: "chart.png Insert image",
    })
    await expect(command).toBeVisible()
    await command.click()

    await expect.poll(() => fieldText(notes)).toMatch(/!\[chart\.png\]\(.+\)/)
  })
})
