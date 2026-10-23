import { isDesktop } from "./platform"

/** F11 toggles native fullscreen on Windows/Linux; macOS has its own menu shortcut. */
export function initFullscreen(): void {
  if (!isDesktop()) return
  if (navigator.userAgent.includes("Mac")) return

  async function toggle(): Promise<void> {
    const { getCurrentWebviewWindow } =
      await import("@tauri-apps/api/webviewWindow")
    const win = getCurrentWebviewWindow()
    await win.setFullscreen(!(await win.isFullscreen()))
  }

  window.addEventListener("keydown", (e) => {
    if (e.key !== "F11") return

    e.preventDefault()
    if (!e.repeat) void toggle()
  })
}
