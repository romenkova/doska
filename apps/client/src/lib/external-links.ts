import { navigate } from "wouter/use-browser-location"
import { getServerUrl } from "@doska/core"
import { isDesktop } from "./platform"

const EXTERNAL_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"]

/**
 * A link is ours if it names our own sync server.
 */
function isInternal(url: URL): boolean {
  if (url.origin === window.location.origin) return true

  const server = getServerUrl()
  if (!server) return false
  try {
    return url.origin === new URL(server).origin
  } catch {
    return false
  }
}

/**
 * The Tauri webview `target="_blank"` support
 */
export function initExternalLinks(): void {
  if (!isDesktop()) return

  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest("a")
      if (!anchor || anchor.target !== "_blank") return
      if (!EXTERNAL_PROTOCOLS.includes(anchor.protocol)) return

      const url = new URL(anchor.href)
      event.preventDefault()

      if (isInternal(url)) {
        navigate(url.pathname + url.search + url.hash)
        return
      }

      void import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
        openUrl(url.href)
      )
    },
    { capture: true }
  )
}
