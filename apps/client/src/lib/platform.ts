/** True inside the packaged Tauri webview. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

/**
 * True where the window's traffic lights float over the app's top-left corner,
 * so whatever sits there has to leave room for them (macOS `titleBarStyle: Overlay`).
 */
export function hasOverlayTitleBar(): boolean {
  return isDesktop() && navigator.userAgent.includes("Mac")
}

/** True when launched from the home screen / dock as an installed PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if ("standalone" in navigator && navigator.standalone === true) return true
  return ["standalone", "fullscreen", "minimal-ui"].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches
  )
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1)
  )
}
