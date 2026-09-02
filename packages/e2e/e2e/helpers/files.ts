import type { JSHandle, Locator, Page } from "@playwright/test"
import { cardPanel } from "./card"

export function attachmentRow(page: Page, name: string) {
  return cardPanel(page)
    .locator('[data-slot="attachment"]')
    .filter({ hasText: name })
}

/* -------------------------------------------------------------------------- */
/*  File helpers. Uploads go to the real `/api/files` route and land on real    */
/*  storage — a temp dir under the host-run config, the mounted volume in a     */
/*  container run — so nothing here stubs the backend.                          */
/* -------------------------------------------------------------------------- */

/**
 * A 1×1 PNG, small enough to inline as base64. Must decode in every browser
 */
export const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII="

export const PNG = Buffer.from(PNG_BASE64, "base64")

interface FileTransfer {
  items: { add(file: unknown): void }
  setData(type: string, data: string): void
}

// The callbacks below are typechecked here but run in the page, where these
// globals exist; Node has no DOM lib. Type-only, so nothing is emitted.
declare const DataTransfer: { new (): FileTransfer }
declare const ClipboardEvent: {
  new (
    type: string,
    init: { clipboardData: unknown; bubbles: boolean; cancelable: boolean }
  ): Event
}

/**
 * A `DataTransfer` carrying one PNG, for driving drags and pastes
 */
export function pngDataTransfer(
  page: Page,
  name: string
): Promise<JSHandle<FileTransfer>> {
  return page.evaluateHandle(
    ({ b64, fileName }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const transfer = new DataTransfer()
      transfer.items.add(new File([bytes], fileName, { type: "image/png" }))
      return transfer
    },
    { b64: PNG_BASE64, fileName: name }
  )
}

/** A `DataTransfer` carrying plain text, for driving a text paste. */
export function textDataTransfer(
  page: Page,
  text: string
): Promise<JSHandle<FileTransfer>> {
  return page.evaluateHandle((text) => {
    const transfer = new DataTransfer()
    transfer.setData("text/plain", text)
    return transfer
  }, text)
}

/**
 * Pastes `transfer` into `target`. Playwright's `dispatchEvent` can't build a
 * ClipboardEvent, and a plain Event carries no `clipboardData` for the paste
 * handler to read — so the event is constructed in the page.
 */
export async function pasteInto(
  target: Locator,
  transfer: JSHandle<FileTransfer>
): Promise<void> {
  await target.evaluate((el, data) => {
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      })
    )
  }, transfer)
}
