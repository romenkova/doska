/** True inside the packaged Tauri webview. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

/** True when launched from the home screen / dock as an installed PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if ("standalone" in navigator && navigator.standalone === true) return true
  return ["standalone", "fullscreen", "minimal-ui"].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches
  )
}
