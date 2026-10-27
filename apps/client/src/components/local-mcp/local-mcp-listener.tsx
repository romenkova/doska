import { useEffect } from "react"
import type { McpRequest } from "@/lib/local-mcp-server"
import { isDesktop } from "@/lib/platform"
import { useAppVersion } from "@/lib/version"

/** Runs Local MCP requests that the desktop side relays to the main window. */
export function LocalMcpListener() {
  const version = useAppVersion()

  useEffect(() => {
    if (!isDesktop()) return

    const unlisten = Promise.all([
      import("@tauri-apps/api/core"),
      import("@tauri-apps/api/window"),
      import("@/lib/local-mcp-server"),
    ]).then(([{ invoke }, { getCurrentWindow }, { answer }]) =>
      getCurrentWindow().listen<McpRequest>(
        "local-mcp:request",
        async ({ payload }) => {
          const reply = await answer(payload, version).then(
            async (response) => ({
              status: response.status,
              contentType: response.headers.get("Content-Type") ?? "text/plain",
              body: await response.text(),
            }),
            (error: unknown) => ({
              status: 500,
              contentType: "text/plain",
              body: String(error),
            })
          )
          await invoke("local_mcp_reply", { id: payload.id, ...reply })
        }
      )
    )

    return () => {
      // Unlistening straight after listen can throw inside Tauri.
      void unlisten.then((stop) => stop()).catch(() => {})
    }
  }, [version])

  return null
}
