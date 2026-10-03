import type { Http } from "@doska/ports"
import { getServerUrl, subscribeServerUrl } from "@doska/core"

/**
 * React Native's `fetch` reaches any origin — there is no CORS to route around,
 * so unlike desktop this needs no native transport. What it does need is a base
 * URL, and `isConfigured` is false until the user supplies one.
 */
export const mobileHttp: Http = {
  fetch: (input, init) => globalThis.fetch(input, init),
  url: (path) => `${getServerUrl()}${path}`,
  isConfigured: () => getServerUrl() !== "",
  subscribe: subscribeServerUrl,
}
