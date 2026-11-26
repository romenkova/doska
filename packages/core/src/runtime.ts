import type {
  Auth,
  ClientDB,
  Foreground,
  Http,
  KeyValue,
  Net,
} from "@doska/ports"

/**
 * Everything this package needs from the platform underneath it, installed once
 * by the host app before anything else runs.
 *
 * `Files` is absent on purpose: attachments reach their storage through `Http`,
 * so there is no call site that would otherwise branch.
 */
export interface Runtime {
  db: ClientDB
  kv: KeyValue
  http: Http
  auth: Auth
  net: Net
  foreground: Foreground
  /**
   * Commits a React state update before returning, where the renderer can do
   * that — `react-dom`'s `flushSync`. A platform without one runs the update
   * as-is and degrades to a deferred commit.
   */
  flushSync: (update: () => void) => void
}

let installed: Runtime | null = null

export function installRuntime(next: Runtime): void {
  installed = next
}

export function runtime(): Runtime {
  if (!installed) throw new Error("runtime used before installRuntime()")
  return installed
}
