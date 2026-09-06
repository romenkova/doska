import { cn } from "@doska/ui-kit"

interface Part {
  text: string
  className?: string
}

type Line = Part[]

const accent = "text-terminal-accent"
const dim = "text-terminal-muted"
const ok = "text-terminal-ok"
const bold = "font-semibold"

const installSession: Line[] = [
  [
    {
      text: "$ install.sh",
    },
  ],
  [{ text: " " }],
  [
    { text: "[1/4] ", className: accent },
    { text: "Checking prerequisites", className: bold },
  ],
  [
    { text: "      ✓ ", className: ok },
    { text: "docker, docker compose and curl found" },
  ],
  [{ text: " " }],
  [
    { text: "[2/4] ", className: accent },
    { text: "Fetching files", className: bold },
  ],
  [{ text: "      Using the v0.18.0 stack definition", className: dim }],
  [
    { text: "      ✓ ", className: ok },
    { text: "docker-compose.selfhost.yml downloaded" },
  ],
  [{ text: " " }],
  [
    { text: "[3/4] ", className: accent },
    { text: "Configuring", className: bold },
  ],
  [
    { text: "? ", className: accent },
    { text: "Admin login " },
    { text: "[admin]", className: dim },
    { text: ": admin" },
  ],
  [{ text: "? ", className: accent }, { text: "Admin password: ••••••••" }],
  [
    { text: "? ", className: accent },
    { text: "Public domain for HTTPS (blank for http): " },
  ],
  [
    { text: "? ", className: accent },
    { text: "Reach this from other devices " },
    { text: "[y/N]", className: dim },
    { text: ": y" },
  ],
  [{ text: "      ✓ ", className: ok }, { text: ".env written (chmod 600)" }],
  [{ text: " " }],
  [
    { text: "[4/4] ", className: accent },
    { text: "Launching", className: bold },
  ],
  [{ text: "      Pulling images", className: dim }],
  [{ text: "      Starting containers", className: dim }],
  [{ text: " " }],
  [{ text: "✓ Doska is up and running!", className: cn(ok, bold) }],
  [
    { text: "  Open   ", className: bold },
    { text: "http://192.168.1.24:8080" },
  ],
  [{ text: "  Login  ", className: bold }, { text: "admin" }],
]

function Terminal({ lines }: { lines: Line[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-terminal-border bg-terminal text-terminal-foreground">
      <div className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line.map((part, j) => (
              <span key={j} className={part.className}>
                {part.text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

export function InstallTerminal() {
  return <Terminal lines={installSession} />
}
