import { Button, Card, Checkbox, cn } from "@doska/ui-kit"
import { useState } from "react"
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Download,
  GitFork,
  Moon,
  Paperclip,
  Sun,
} from "lucide-react"

const repo = "https://github.com/romenkova/doska"
const releases = `${repo}/releases`
const installCommand =
  "curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh"

function ThemeToggle() {
  // No React state: the icon tracks the `.dark` class via Tailwind variants, so
  // server and client render identically and there's nothing to hydrate.
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark")
    document.documentElement.classList.toggle("light", !dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      aria-label="Toggle color theme"
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </Button>
  )
}

/** The `ROAD-12`-style id every card carries. Click to copy — same as the app. */
function IdChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title="Copy id"
      onClick={() => {
        navigator.clipboard?.writeText(id)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="text-muted-foreground hover:text-foreground shrink-0 rounded px-1 font-mono text-[11px] transition-colors"
    >
      {copied ? "copied" : id}
    </button>
  )
}

function BoardCard({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <Card className="gap-2 px-3 py-2.5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm leading-snug font-bold">{title}</h3>
        <IdChip id={id} />
      </div>
      {children}
    </Card>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
      {children}
    </p>
  )
}

const chipTones = {
  soon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-500/15 text-red-600 dark:text-red-400",
  neutral: "bg-muted text-muted-foreground",
}

function Chip({
  tone,
  children,
}: {
  tone: keyof typeof chipTones
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        chipTones[tone]
      )}
    >
      {children}
    </span>
  )
}

function Column({
  name,
  prefix,
  color,
  count,
  children,
}: {
  name: string
  prefix: string
  color: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <span className="font-heading text-sm font-bold">{name}</span>
        <span className="text-muted-foreground font-mono text-[11px]">
          {prefix}
        </span>
        <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 text-[11px] font-medium">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

const initialTasks = [
  { label: "Written in Markdown", done: true },
  { label: "Slash menu for formatting", done: true },
  { label: "Tick an item — watch the count", done: false },
  { label: "Nothing left to do", done: false },
]

function MarkdownCard() {
  const [tasks, setTasks] = useState(initialTasks)
  const done = tasks.filter((t) => t.done).length
  const toggle = (i: number) =>
    setTasks((ts) =>
      ts.map((t, j) => (j === i ? { ...t, done: !t.done } : t))
    )
  return (
    <BoardCard id="CARD-1" title="Cards are Markdown">
      <Body>
        GitHub-flavored Markdown, edited in place. Task lists carry a live
        progress count:
      </Body>
      <div className="mt-1 flex items-center gap-2">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${(done / tasks.length) * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          {done}/{tasks.length}
        </span>
      </div>
      <ul className="mt-1 flex flex-col gap-1.5">
        {tasks.map((t, i) => (
          <li key={t.label} className="flex items-center gap-2">
            <Checkbox
              checked={t.done}
              onCheckedChange={() => toggle(i)}
              aria-label={t.label}
            />
            <span
              className={cn(
                "text-[13px]",
                t.done && "text-muted-foreground line-through"
              )}
            >
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </BoardCard>
  )
}

export function App() {
  return (
    <div className="min-h-svh">
      <header className="bg-background/80 border-border sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-7" />
            Doska
            <span className="text-muted-foreground hidden font-normal sm:inline">
              / a board that is also a landing page
            </span>
          </a>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="outline"
              className="ml-2 h-9 gap-2 px-4"
              render={<a href={repo} />}
            >
              <GitFork className="size-4" />
              GitHub
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-16 pb-10">
          <p className="text-muted-foreground mb-4 font-mono text-sm tracking-tight">
            Open source · local-first
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            A Kanban board where the cards are Markdown
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
            It's local-first: your boards live in the browser, so it's fast and
            works without an account. Sync is opt-in — point it at a server you
            run and it keeps the canonical copy.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-11 gap-2 px-5 text-base"
              render={<a href={repo} />}
            >
              <GitFork className="size-4" />
              View on GitHub
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 gap-2 px-5 text-base"
              render={<a href={releases} />}
            >
              <Download className="size-4" />
              Download for macOS
            </Button>
          </div>
          <p className="text-muted-foreground mt-8 font-mono text-xs">
            ↓ the rest of this page is one of its boards. tick a box, copy an id.
          </p>
        </section>
      </main>

      {/* The board canvas: a real column layout, on a dotted workspace grid. */}
      <div
        className="overflow-x-auto pb-24"
        style={{
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="mx-auto flex max-w-6xl gap-5 px-6 py-8">
          <Column name="Cards" prefix="CARD" color="#725cff" count={3}>
            <MarkdownCard />

            <BoardCard id="CARD-2" title="Attachments">
              <Body>Drop images or files onto a card. Images preview inline.</Body>
              <div className="from-primary/15 to-accent mt-1 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br">
                <img src="/favicon.svg" alt="" className="size-8 opacity-80" />
              </div>
              <span className="text-muted-foreground inline-flex w-fit items-center gap-1 font-mono text-[11px]">
                <Paperclip className="size-3" />
                board-preview.png
              </span>
            </BoardCard>

            <BoardCard id="CARD-3" title="Deadlines">
              <Body>
                Set a due date. The chip shifts color as it nears and turns red
                once it's overdue.
              </Body>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="soon">
                  <CalendarClock className="size-3" />
                  in 3 days
                </Chip>
                <Chip tone="overdue">overdue</Chip>
              </div>
            </BoardCard>
          </Column>

          <Column name="Where it lives" prefix="DATA" color="#66ae96" count={3}>
            <BoardCard id="DATA-1" title="Local-first">
              <Body>
                Boards live in the browser (IndexedDB). Reads and writes hit your
                device, not the network — so it's fast and works offline.
              </Body>
            </BoardCard>

            <BoardCard id="DATA-2" title="Sync is opt-in">
              <Body>
                Point it at a server you run and boards replicate to every device
                in the background. Nothing leaves your machine until you set that
                up.
              </Body>
            </BoardCard>

            <BoardCard id="DATA-3" title="An honest caveat">
              <Body>
                Browser storage isn't permanent — the browser can still clear it,
                and "clear site data" always will. Treat local-only as a working
                copy. If the boards matter, run a server for the durable one.
              </Body>
              <span className="w-fit">
                <Chip tone="overdue">best-effort storage</Chip>
              </span>
            </BoardCard>
          </Column>

          <Column name="Run it" prefix="RUN" color="#e0a458" count={3}>
            <BoardCard id="RUN-1" title="Self-host in one line">
              <Body>
                Generates the secrets and brings the stack up. Re-run any time to
                pull newer images — it keeps your config.
              </Body>
              <pre className="bg-muted text-foreground/90 mt-1 overflow-x-auto rounded-lg p-2.5 font-mono text-[11px] leading-relaxed">
                {installCommand}
              </pre>
              <a
                href={`${repo}#self-hosting`}
                className="text-primary inline-flex w-fit items-center gap-1 text-[13px] font-medium hover:underline"
              >
                Self-hosting guide
                <ArrowRight className="size-3.5" />
              </a>
            </BoardCard>

            <BoardCard id="RUN-2" title="Runs where you do">
              <Body>
                In the browser, installed as a PWA, or a native macOS app that
                reuses the same client and auto-updates.
              </Body>
            </BoardCard>

            <BoardCard id="RUN-3" title="Agents can edit it too">
              <Body>
                The server exposes your boards over MCP, so Claude can read and
                edit them — create cards, tick task lists, move things.
              </Body>
              <pre className="bg-muted text-foreground/90 mt-1 overflow-x-auto rounded-lg p-2.5 font-mono text-[11px] leading-relaxed">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Bot className="size-3" /> mcp
                </span>
                {"\n"}claude mcp add --transport http doska \{"\n"}
                {"  "}https://your-server/mcp
              </pre>
            </BoardCard>
          </Column>
        </div>
      </div>

      <footer className="border-border mx-auto flex max-w-6xl items-center justify-between border-t px-6 py-8 text-sm">
        <span className="text-muted-foreground">Doska — MIT licensed</span>
        <a
          href={repo}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Source
        </a>
      </footer>
    </div>
  )
}
