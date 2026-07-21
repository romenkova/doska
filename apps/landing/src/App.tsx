import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardId,
  CardTitle,
  Checkbox,
  DeadlineChip,
  TaskIndicator,
  cn,
  columnHue,
} from "@doska/ui-kit"
import { useState, type ReactNode } from "react"
import { Download, GitFork, Moon, Paperclip, Sun } from "lucide-react"
import "@doska/markdown/markdown.css"

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

/** A `[label]` pill. The color index picks a hue from the markdown tag palette. */
function Tag({ color, children }: { color: number; children: ReactNode }) {
  return (
    <span className="tag" data-tag-color={color}>
      {children}
    </span>
  )
}

const initialTasks = [
  { label: "Written in Markdown", done: true },
  { label: "Slash menu for formatting", done: true },
  { label: "Tick a box — watch the count", done: false },
  { label: "Nothing left to do", done: false },
]

function TaskList({
  tasks,
  onToggle,
}: {
  tasks: typeof initialTasks
  onToggle: (index: number) => void
}) {
  return (
    <ul>
      {tasks.map((task, i) => (
        <li key={task.label} className="task-list-item">
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(i)}
            aria-label={task.label}
            className="-mt-0.5 mr-1.5 inline-flex cursor-pointer align-middle"
          />
          {task.label}
        </li>
      ))}
    </ul>
  )
}

function Column({
  title,
  color,
  count,
  children,
}: {
  title: string
  color: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm text-muted-foreground uppercase">
        <span
          className="size-2.5 rounded-full"
          style={{ background: `oklch(0.72 0.14 ${columnHue(color)})` }}
        />
        <span className="font-heading font-bold">{title}</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 text-[11px] font-medium">
          {count}
        </span>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col rounded-3xl border bg-background p-4",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * A board card. Same ui-kit slots as the app's card, and the body sits in
 * `.markdown` so it picks up the renderer's typography without shipping it.
 */
function BoardCard({
  id,
  title,
  deadline,
  tasks,
  children,
}: {
  id: string
  title: string
  /** Fixed dates only — a relative one ("in 3 days") would break prerendering. */
  deadline?: string
  tasks?: { done: number; total: number }
  children: ReactNode
}) {
  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <CardId id={id} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {tasks && <TaskIndicator done={tasks.done} total={tasks.total} />}
          {deadline && <DeadlineChip value={deadline} />}
        </div>
      </CardContent>
      <CardContent className="pt-2">
        <div className="markdown preview">{children}</div>
      </CardContent>
    </Card>
  )
}

export function App() {
  const [tasks, setTasks] = useState(initialTasks)
  const done = tasks.filter((t) => t.done).length

  const toggleTask = (index: number) =>
    setTasks((ts) =>
      ts.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    )

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-7" />
            Doska
            <span className="hidden font-normal text-muted-foreground sm:inline">
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
          <p className="mb-4 font-mono text-sm tracking-tight text-muted-foreground">
            Open source · local-first
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            A Kanban board where the cards are Markdown
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
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
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            ↓ the rest of this page is one of its boards. tick a box, copy an
            id.
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
        <div className="mx-auto flex max-w-6xl items-start gap-5 px-6 py-8">
          <Column title="Cards" color="violet" count={3}>
            <BoardCard
              id="CARD-1"
              title="Cards are Markdown"
              tasks={{ done, total: tasks.length }}
            >
              <p>
                GitHub-flavored Markdown, edited in place —{" "}
                <strong>bold</strong>, <code>code</code>,{" "}
                <a href={repo}>links</a>, <mark>highlights</mark>. Task lists
                carry a live count, up in the header:
              </p>
              <TaskList tasks={tasks} onToggle={toggleTask} />
            </BoardCard>

            <BoardCard id="CARD-2" title="Attachments and tags">
              <p>
                Drop images or files onto a card. Images preview inline,
                everything else lands as a link:
              </p>
              {/* Stands in for an attached screenshot — same box `.markdown img`
                  gives a real one, so the layout matches. */}
              <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent">
                <img
                  src="/favicon.svg"
                  alt=""
                  className="my-0 size-10 opacity-80"
                />
              </div>
              <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Paperclip className="size-3" />
                board-preview.png
              </p>
              <p>
                Bracketed words become colored pills, so a card can carry its
                own labels: <Tag color={4}>design</Tag>{" "}
                <Tag color={9}>needs review</Tag>
              </p>
            </BoardCard>

            <BoardCard id="CARD-3" title="Deadlines" deadline="2020-04-01">
              <p>
                Set a due date and the chip shifts color as it nears — muted,
                then amber, then red once it's overdue. Like this one, which has
                been overdue for a while.
              </p>
            </BoardCard>
          </Column>

          <Column title="Where it lives" color="green" count={3}>
            <BoardCard id="DATA-1" title="Local-first">
              <p>
                Boards live in the browser (IndexedDB). Reads and writes hit
                your device, not the network — so it's fast, and it works
                offline.
              </p>
            </BoardCard>

            <BoardCard id="DATA-2" title="Sync is opt-in">
              <p>
                Point it at a server you run and boards replicate to every
                device in the background. Nothing leaves your machine until you
                set that up.
              </p>
            </BoardCard>

            <BoardCard id="DATA-3" title="An honest caveat">
              <blockquote>
                Browser storage isn't permanent. The browser can evict it, and
                "clear site data" always will.
              </blockquote>
              <p>
                Treat local-only as a working copy. If the boards matter, run a
                server for the durable one.
              </p>
            </BoardCard>
          </Column>

          <Column title="Run it" color="amber" count={3}>
            <BoardCard id="RUN-1" title="Self-host in one line">
              <pre>
                <code>{installCommand}</code>
              </pre>
              <p>
                Generates the secrets and brings the stack up. Re-run any time
                to pull newer images — it keeps your config. There's a{" "}
                <a href={`${repo}#self-hosting`}>self-hosting guide</a>.
              </p>
            </BoardCard>

            <BoardCard id="RUN-2" title="Runs where you do">
              <p>
                In the browser, installed as a PWA, or a native macOS app that
                reuses the same client and auto-updates.
              </p>
            </BoardCard>

            <BoardCard id="RUN-3" title="Agents can edit it too">
              <p>
                The server exposes your boards over MCP, so Claude can read and
                edit them — create cards, tick task lists, move things.
              </p>
              <pre>
                <code>
                  claude mcp add --transport http doska \{"\n"}
                  {"  "}https://your-server/mcp
                </code>
              </pre>
            </BoardCard>
          </Column>
        </div>
      </div>

      <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-border px-6 py-8 text-sm">
        <span className="text-muted-foreground">Doska — MIT licensed</span>
        <a
          href={repo}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Source
        </a>
      </footer>
    </div>
  )
}
