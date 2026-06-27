import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  createBoard,
  editCardBody,
  openCard,
  retitleCard,
} from "../helpers"

/**
 * The card body is markdown: a user edits it in the modal's "Notes" field, and
 * the board card renders a preview of it under the title. These assert on the
 * text a user reads, not on the markdown source or how it's marked up, so they
 * survive styling and rendering tweaks.
 */
test.describe("card body", () => {
  test("editing a card's notes persists across a reload", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Has notes")

    await editCardBody(page, "Has notes", "Ship the release on Friday")

    // The note renders on the board card...
    await expect(page.getByText("Ship the release on Friday")).toBeVisible()
    // ...and survives an IndexedDB round-trip.
    await page.reload()
    await expect(page.getByText("Ship the release on Friday")).toBeVisible()

    // Reopening the card shows the saved note back in the editor.
    await openCard(page, "Has notes")
    await expect(page.getByPlaceholder("Notes")).toHaveValue(
      "Ship the release on Friday"
    )
  })

  test("a card with only a body (no extra title) still shows its note", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    // Don't rename it — just give the default card a body.
    await editCardBody(page, "Untitled card", "A quick reminder")

    await expect(page.getByText("A quick reminder")).toBeVisible()
  })

  test("the -cut- marker hides everything below it on the board card", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Long note")

    await editCardBody(
      page,
      "Long note",
      "Summary up top\n\n-cut-\n\nLots of detail below"
    )

    // Above the cut shows on the card; below it is withheld behind a hint.
    await expect(page.getByText("Summary up top")).toBeVisible()
    await expect(page.getByText("Lots of detail below")).toHaveCount(0)
    await expect(page.getByText("Open to see more")).toBeVisible()

    // Opening the card reveals the full note in the editor.
    await openCard(page, "Long note")
    await expect(page.getByPlaceholder("Notes")).toHaveValue(
      "Summary up top\n\n-cut-\n\nLots of detail below"
    )
  })

  test("a column's hide-body toggle flips between hiding and showing", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Titled card")
    await editCardBody(page, "Titled card", "Body to be hidden")
    await expect(page.getByText("Body to be hidden")).toBeVisible()

    // Collapse bodies in the column. The collapse is an animated CSS transition
    // rather than an unmount, so assert on the toggle's own state (it now offers
    // to *show* bodies) and that the card itself remains — not on measuring the
    // clipped body, which would be brittle.
    await page.getByRole("button", { name: "Hide body in To Do" }).click()
    await expect(
      page.getByRole("button", { name: "Show body in To Do" })
    ).toBeVisible()
    await expect(card(page, "Titled card")).toBeVisible()

    // The collapse is persisted on the column, so it survives a reload.
    await page.reload()
    await expect(
      page.getByRole("button", { name: "Show body in To Do" })
    ).toBeVisible()

    // Toggling back returns the control to "hide".
    await page.getByRole("button", { name: "Show body in To Do" }).click()
    await expect(
      page.getByRole("button", { name: "Hide body in To Do" })
    ).toBeVisible()
  })
})
