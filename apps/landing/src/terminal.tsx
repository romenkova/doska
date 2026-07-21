import { cn } from "@doska/ui-kit"

interface Line {
  text: string
  className?: string
}

const call = "text-terminal-accent"
const result = "text-terminal-muted"
const ok = "text-terminal-ok"

const installSession: Line[] = [
  { text: `$ install.sh` },
  { text: "  ⎿ secrets generated", className: result },
  { text: "  ⎿ images pulled", className: result },
  { text: "✓ installed and running on :8080", className: ok },
]

const mcpSession: Line[] = [
  { text: "$ claude" },
  { text: "> add a card for the offline bug" },
  { text: "⏺ get_board(roadmap)", className: call },
  { text: "  ⎿ 3 columns · 12 cards", className: result },
  { text: '⏺ create_card("Offline banner")', className: call },
  { text: "  ⎿ created ROAD-13 in Todo", className: ok },
]

/** A terminal window: static output, optionally with a blinking cursor left at the end. */
function Terminal({ lines, cursor }: { lines: Line[]; cursor?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-terminal-border bg-terminal text-terminal-foreground">
      <div className="flex items-center gap-1.5 border-b border-terminal-border p-2">
        <span className="size-2 rounded-full bg-terminal-muted/40" />
        <span className="size-2 rounded-full bg-terminal-muted/40" />
        <span className="size-2 rounded-full bg-terminal-muted/40" />
      </div>
      <div className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre">
        {lines.map((line) => (
          <span key={line.text} className={cn("block", line.className)}>
            {line.text}
          </span>
        ))}
        {cursor && (
          <span className="inline-block h-[0.9em] w-0.5 animate-terminal-blink bg-terminal-accent align-text-bottom motion-reduce:animate-none" />
        )}
      </div>
    </div>
  )
}

/** The one-line self-host: fetch the script, run it, get a running stack. */
export function InstallTerminal() {
  return <Terminal lines={installSession} />
}

/** An agent over MCP: reading the board, then adding a card to it. */
export function McpTerminal() {
  return <Terminal lines={mcpSession} cursor />
}
