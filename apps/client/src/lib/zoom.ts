import { isDesktop } from "./platform"

const STORAGE_KEY = "zoom"
const STEP = 0.1
const MIN = 0.5
const MAX = 2
const DEFAULT = 1

function clamp(value: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(value * 10) / 10))
}

function read(): number {
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  return saved >= MIN && saved <= MAX ? saved : DEFAULT
}

async function apply(level: number): Promise<void> {
  localStorage.setItem(STORAGE_KEY, String(level))
  if (isDesktop()) {
    // Native webview zoom reflows the layout like a browser; CSS `zoom` on the
    // root instead scales past the fixed app shell and clips.
    const { getCurrentWebviewWindow } = await import(
      "@tauri-apps/api/webviewWindow"
    )
    await getCurrentWebviewWindow().setZoom(level)
  } else {
    document.documentElement.style.zoom = String(level)
  }
}

/** Cmd/Ctrl +/-/0 zoom for the whole app, persisted across launches. */
export function initZoom(): void {
  void apply(read())

  window.addEventListener("keydown", (e) => {
    if (!e.metaKey && !e.ctrlKey) return

    if (e.key === "=" || e.key === "+") {
      e.preventDefault()
      void apply(clamp(read() + STEP))
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault()
      void apply(clamp(read() - STEP))
    } else if (e.key === "0") {
      e.preventDefault()
      void apply(DEFAULT)
    }
  })
}
