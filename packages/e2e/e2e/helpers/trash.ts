import { expect, type Page } from "@playwright/test"

/* -------------------------------------------------------------------------- */
/*  Trash helpers. Entries are addressed by the title the user deleted, and    */
/*  restoring goes through the same button they'd press.                       */
/* -------------------------------------------------------------------------- */

/** Opens the trash from the sidebar and waits for the view. */
export async function openTrash(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Trash", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Trash" })).toBeVisible()
}

/** A trash entry, located by the title of the thing that was deleted. Scoped to
 * the trash list — the sidebar's board list is made of listitems too. */
export function trashEntry(page: Page, title: string) {
  return page
    .getByRole("list", { name: "Deleted items" })
    .getByRole("listitem")
    .filter({ hasText: title })
}

/** Restores the entry titled `title` and waits for it to leave the trash. */
export async function restoreFromTrash(
  page: Page,
  title: string
): Promise<void> {
  const entry = trashEntry(page, title)
  await entry.getByRole("button", { name: "Restore" }).click()
  await expect(entry).toHaveCount(0)
}

/** Deletes the entry titled `title` for good, through the confirm dialog. */
export async function deleteForeverFromTrash(
  page: Page,
  title: string
): Promise<void> {
  const entry = trashEntry(page, title)
  await entry.getByRole("button", { name: "Delete" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete forever" })
    .click()
  await expect(entry).toHaveCount(0)
}
