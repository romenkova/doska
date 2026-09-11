import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import { routes } from "@/lib/routes"

export interface DropPoint {
  x: number
  y: number
}

const windowLabel = (cardId: string) => `popout-${cardId}`

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
  if (existing) {
    await existing.setFocus()
    return
  }
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
