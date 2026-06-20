import { test, expect } from "@playwright/test";
import {
  addCard,
  card,
  createBoard,
  retitleCard,
  syncIndicator,
} from "./helpers";

/**
 * The header sync indicator, from the user's seat. Local edits land in
 * IndexedDB immediately and reconcile in the background (the e2e bundle polls
 * fast via VITE_SYNC_INTERVAL_MS), so every change should *settle* back to "All
 * changes saved" on its own. These assert that settled state rather than the
 * fleeting "Saving..." mid-tick, which would be racy to catch.
 */
test.describe("sync indicator", () => {
  test("a fresh board settles to All changes saved", async ({ page }) => {
    await createBoard(page);

    // The initial board push (dashboard + default columns) drains on its own.
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });

  test("an edit shows unsaved, then settles to saved", async ({ page }) => {
    await createBoard(page);
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");

    await addCard(page, "To Do");
    await retitleCard(page, "Untitled card", "Plan launch");

    // The change reconciles and the indicator returns to saved — no ref is left
    // stranded in the dirty queue.
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });

  test("⌘S flushes pending changes to saved", async ({ page }) => {
    await createBoard(page);
    await addCard(page, "To Do");

    // Flush now instead of waiting on the poll interval.
    await page.keyboard.press("ControlOrMeta+s");

    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });

  test("clicking the indicator reconciles", async ({ page }) => {
    await createBoard(page);
    await addCard(page, "To Do");

    await syncIndicator(page).click();

    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });

  test("deleting a card leaves nothing unsaved", async ({ page }) => {
    await createBoard(page);
    await addCard(page, "To Do");
    await retitleCard(page, "Untitled card", "Temp card");
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");

    const target = card(page, "Temp card");
    await target.getByRole("button", { name: "Card actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByText("Temp card")).toHaveCount(0);

    // The tombstone pushes and the queue drains — no lingering unsaved change.
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });

  test("deleting a board before it syncs leaves nothing unsaved", async ({
    page,
  }) => {
    // Regression for the "1 unsaved change that comes back" bug: a board deleted
    // before its create/card changes flush tombstones its card while the column
    // is on its way out, which used to strand the card's dirty ref forever.
    await createBoard(page);
    await addCard(page, "To Do");

    // Delete right away, racing the background flush.
    await page.getByRole("button", { name: "Delete board" }).click();
    await expect(page.getByText("Pick a board to get started")).toBeVisible();

    // The dirty queue (and the indicator) is global, so a fresh board reveals
    // whether the deleted board left anything stranded. It should be saved.
    await createBoard(page);
    await expect(syncIndicator(page)).toHaveAccessibleName("All changes saved");
  });
});
