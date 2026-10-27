import { Button, cn } from "@doska/ui-kit"
import { claudeCodeCommand, useLocalMcp } from "@/lib/local-mcp"
import { CopyField } from "./copy-field"

export function LocalMcpPanel() {
  const mcp = useLocalMcp()
  if (!mcp) return null

  const note =
    mcp.error ??
    (mcp.saveError
      ? `Settings didn't save, so they won't survive a restart: ${mcp.saveError}`
      : "Local MCP works only when the app is open.")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="text-sm">Agents on this computer</span>
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs",
                mcp.error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  mcp.error && "bg-destructive",
                  !mcp.error && mcp.enabled && "bg-emerald-500",
                  !mcp.error && !mcp.enabled && "bg-muted-foreground/40"
                )}
              />
              {mcp.error ? "Not running" : mcp.enabled ? "Enabled" : "Disabled"}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{note}</span>
        </span>
        <Button
          type="button"
          variant={mcp.enabled ? "ghost" : "secondary"}
          size="sm"
          onClick={() => mcp.setEnabled(!mcp.enabled)}
        >
          {mcp.enabled ? "Turn off" : "Turn on"}
        </Button>
      </div>

      {mcp.error && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            A new port means pasting the command into your agents again.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={mcp.pickPort}
          >
            Pick a new port
          </Button>
        </div>
      )}

      {mcp.enabled && mcp.url && mcp.token && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Claude Code</span>
            <CopyField
              label="command"
              value={claudeCodeCommand(mcp.url, mcp.token)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Other clients</span>
            <CopyField label="URL" value={mcp.url} />
            <CopyField
              label="token"
              value={mcp.token}
              display={`${mcp.token.slice(0, 8)}••••••••`}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Resetting disconnects every agent using the current token.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={mcp.resetToken}
            >
              Reset token
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
