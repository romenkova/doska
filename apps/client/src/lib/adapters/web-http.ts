import type { Http } from "@doska/ports"
import { isDesktop } from "@/lib/platform"
import { getServerUrl, subscribeServerUrl } from "@doska/core"

export const webHttp: Http = {
  // On desktop this routes through Tauri's HTTP plugin, so the request runs in
  // Rust and bypasses the webview's CORS.
  fetch: async (input, init) => {
    if (isDesktop()) {
      const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http")
      return tauriFetch(input, init)
    }
    return globalThis.fetch(input, init)
  },

  url: (path) =>
    `${isDesktop() ? getServerUrl() : window.location.origin}${path}`,

  isConfigured: () => !isDesktop() || getServerUrl() !== "",

  subscribe: subscribeServerUrl,
}
