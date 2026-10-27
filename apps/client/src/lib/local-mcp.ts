import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

type Status = {
  enabled: boolean
  url: string | null
  token: string | null
  error: string | null
  saveError: string | null
}

export type LocalMcp = Status & {
  setEnabled(enabled: boolean): void
  resetToken(): void
  pickPort(): void
}

const OFF: Status = {
  enabled: false,
  url: null,
  token: null,
  error: null,
  saveError: null,
}

/** Null until the desktop side answers. */
export function useLocalMcp(): LocalMcp | null {
  const [status, setStatus] = useState<Status | null>(null)

  function call(command: string, args?: Record<string, unknown>) {
    invoke<Status>(command, args).then(setStatus, (error: unknown) =>
      setStatus((prev) => ({ ...(prev ?? OFF), error: String(error) }))
    )
  }

  useEffect(() => {
    call("get_local_mcp")
    // The desktop side restarts a listener that died and reports how it went.
    const unlisten = listen<Status>("local-mcp:status", ({ payload }) =>
      setStatus(payload)
    )
    return () => {
      void unlisten.then((stop) => stop()).catch(() => {})
    }
  }, [])

  if (!status) return null
  return {
    ...status,
    setEnabled: (enabled) => call("set_local_mcp_enabled", { enabled }),
    resetToken: () => call("reset_local_mcp_token"),
    pickPort: () => call("pick_local_mcp_port"),
  }
}

export function claudeCodeCommand(url: string, token: string): string {
  return `claude mcp add --transport http doska-local ${url} --header "Authorization: Bearer ${token}"`
}
