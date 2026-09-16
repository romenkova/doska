import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import { routes } from "@/lib/routes"

export interface DropPoint {
  x: number
  y: number
}

const windowLabel = (cardId: string) => `popout-${cardId}`

/** Popouts hide rather than close, so cap how many linger. */
const MAX_POPOUTS = 5
/** Labels in open order, oldest first. */
const opened: string[] = []

function markOpened(label: string) {
  const i = opened.indexOf(label)
  if (i !== -1) opened.splice(i, 1)
  opened.push(label)
}

/** Destroys the oldest hidden popout while over the cap; visible ones stay. */
async function evictHidden() {
  for (const label of [...opened]) {
    if (opened.length <= MAX_POPOUTS) return
    const win = await WebviewWindow.getByLabel(label)
    if (win && (await win.isVisible())) continue
    opened.splice(opened.indexOf(label), 1)
    if (win) await win.destroy()
  }
}

function themeBackground(): [number, number, number] | undefined {
  const rendered = getComputedStyle(document.body).backgroundColor
  const [red, green, blue] = rendered.match(/\d+/g)?.map(Number) ?? []
  if (red === undefined || green === undefined || blue === undefined) return
  return [red, green, blue]
}

function appTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export async function openCardWindow(cardId: string, at?: DropPoint) {
  const label = windowLabel(cardId)
  const existing = await WebviewWindow.getByLabel(label)
  markOpened(label)
  if (existing) {
    await existing.show()
    await existing.setFocus()
    return
  }
  await evictHidden()
  new WebviewWindow(label, {
    url: routes.cardWindow.to(cardId),
    title: "Doska",
    minWidth: 400,
    minHeight: 320,
    dragDropEnabled: false,
    backgroundColor: themeBackground(),
    theme: appTheme(),
    width: 800,
    height: 640,
    ...at,
  })
}
