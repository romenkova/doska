import { useState } from "react"

export type LocalMcp = {
  enabled: boolean
  url: string
  token: string
  error: string | null
  setEnabled(enabled: boolean): void
  resetToken(): void
}

function newToken(): string {
  return `dsk_${crypto.randomUUID().replaceAll("-", "")}`
}

// Stand-in until the Tauri side owns the server, port and token.
export function useLocalMcp(): LocalMcp {
  const [enabled, setEnabled] = useState(false)
  const [token, setToken] = useState(newToken)

  return {
    enabled,
    url: "http://127.0.0.1:3846/mcp",
    token,
    error: null,
    setEnabled,
    resetToken: () => setToken(newToken()),
  }
}

export function claudeCodeCommand(url: string, token: string): string {
  return `claude mcp add --transport http doska-local ${url} --header "Authorization: Bearer ${token}"`
}
