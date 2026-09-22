import type { FromWebview, ToWebview } from "./bridge"

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void }
    /** Native calls this through `injectJavaScript`. */
    receive?: (message: ToWebview) => void
  }
}

export function post(message: FromWebview) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message))
}
