import { test, expect } from "@playwright/test"
import { DIRTY_KEY, readDirty } from "./helpers"

/**
 * Each test gets an isolated browser context, so IndexedDB/localStorage start
 * empty and the app seeds its fixtures fresh. No manual cleanup needed.
 */
test.describe("sync dirty-set persistence", () => {
  test("creating a board marks records dirty and persists them", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Create a board" }).click()

    // A board create marks the dashboards list and the new board dirty.
    await expect
      .poll(() => readDirty(page))
      .toEqual(
        expect.arrayContaining([expect.stringMatching(/^dashboards\//)])
      )

    const dirty = await readDirty(page)
    expect(dirty.some((ref) => ref.startsWith("boards/"))).toBe(true)
  })

  test("pending dirty refs survive a reload", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Create a board" }).click()
    await expect.poll(() => readDirty(page)).not.toHaveLength(0)

    const before = await readDirty(page)
    await page.reload()
    const after = await readDirty(page)

    expect(after).toEqual(before)
  })

  test("a corrupt dirty value doesn't crash the app", async ({ page }) => {
    // Seed garbage before any app code runs; loadDirty() must swallow it.
    await page.addInitScript((key) => {
      localStorage.setItem(key, "{not valid json")
    }, DIRTY_KEY)

    await page.goto("/")
    // The app still boots and renders.
    await expect(
      page.getByRole("button", { name: "Create a board" })
    ).toBeVisible()

    // And marking dirty recovers to a clean array.
    await page.getByRole("button", { name: "Create a board" }).click()
    await expect.poll(() => readDirty(page)).not.toHaveLength(0)
  })
})
