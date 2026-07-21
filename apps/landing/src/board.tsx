import { useState } from "react"
import { ChevronsRight, Paperclip } from "lucide-react"
import { cn } from "@doska/ui-kit"
import { BoardCard } from "./board-card"
import { Column } from "./column"
import { app, repo } from "./links"
import { Tag } from "./tag"
import { TaskList } from "./task-list"
import { initialTasks } from "./tasks"
import { InstallTerminal, McpTerminal } from "./terminal"
import { Wikilink } from "./wikilink"

/** The page's own board: the pitch, told as cards on a real column layout. */
export function Board() {
  const [tasks, setTasks] = useState(initialTasks)
  const [scrolled, setScrolled] = useState(false)
  const done = tasks.filter((t) => t.done).length

  const toggleTask = (index: number) =>
    setTasks((ts) =>
      ts.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    )

  return (
    // The board canvas, on a dotted workspace grid.
    <div
      className="relative pb-24"
      style={{
        backgroundImage: "radial-gradient(var(--dots) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div
        className="overflow-x-auto"
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 8)}
      >
        <div className="mx-auto flex max-w-6xl items-start gap-5 px-4 py-8 sm:px-6">
          <Column title="Cards" color="violet" count={4}>
            <BoardCard
              id="CARD-1"
              title="Cards are Markdown"
              tasks={{ done, total: tasks.length }}
            >
              <p>
                GitHub-flavored Markdown:
                <br /> <strong>bold</strong>, <code>code</code>,{" "}
                <a href={repo} target="_blank" rel="noreferrer">
                  links
                </a>
                , <mark>highlights</mark>.<br />
                Task lists carry a live count, up in the header (try clicking):
              </p>
              <TaskList tasks={tasks} onToggle={toggleTask} />
              <p>
                I tried to make Markdown editing more bearable: slash commands,
                suggestions.
              </p>
            </BoardCard>

            <BoardCard id="CARD-2" title="Attachments and tags">
              <p>
                File attachments, inline images, support for dragging files into
                a card or pasting from the buffer:
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
                Bracketed words become colored pills:{" "}
                <Tag color={4}>design</Tag> <Tag color={9}>needs review</Tag>
              </p>
            </BoardCard>

            <BoardCard id="CARD-3" title="Deadlines" deadline="2020-04-01">
              <p>
                Set a due date and the chip shifts color as it nears.
                <br />
                Like this one, which has been overdue for a while.
              </p>
            </BoardCard>

            <BoardCard id="CARD-4" title="Cards link to cards">
              <p>
                Type <code>[[</code> and pick a card. The reference (wikilink)
                carries its title and the column it's in: both read live, so a
                rename or a move updates every mention:
              </p>
              <p>
                <Wikilink
                  target="CARD-3"
                  title="Deadlines"
                  column="Cards"
                  color="violet"
                />
              </p>
            </BoardCard>
          </Column>

          <Column title="Where it lives" color="green" count={2}>
            <BoardCard id="DATA-1" title="Local-first">
              <p>
                Boards live in the browser. Reads and writes hit your device,
                not the network, so it's fast, and it works offline.
              </p>
            </BoardCard>

            <BoardCard id="DATA-2" title="Sync is opt-in">
              <p>
                Point it at a server you run and boards replicate to every
                device in the background. Sync happens every couple of seconds,
                or on <code>⌘</code>+<code>S</code>.
              </p>
            </BoardCard>
          </Column>

          <Column title="Run it" color="amber" count={3}>
            <BoardCard id="RUN-1" title="Self-host in one line">
              <InstallTerminal />
              <p>
                Comes with an install script.
                <br /> The script backs up your data, and bundles all you need
                to run the app. Re-run any time to pull newer images. It keeps
                your config. There's a{" "}
                <a
                  href={`${repo}#self-hosting`}
                  target="_blank"
                  rel="noreferrer"
                >
                  self-hosting guide
                </a>
                .
              </p>
            </BoardCard>

            <BoardCard id="RUN-2" title="Runs where you do">
              <p>
                <a href={app} target="_blank" rel="noreferrer">
                  In the browser
                </a>
                , installed as a PWA, or a Tauri macOS app that reuses the same
                client and auto-updates.
                <br />
                No mobile app yet, but the PWA makes the mobile experience
                closer to native.
              </p>
            </BoardCard>

            <BoardCard id="RUN-3" title="Agents can edit it too">
              <p>
                The server exposes your boards over MCP, so Claude or other
                agents can read and edit them: create cards, tick task lists,
                move things.
              </p>
              <McpTerminal />
            </BoardCard>
          </Column>
        </div>
      </div>
      <ScrollHint hidden={scrolled} />
    </div>
  )
}

/**
 * Nudge that the board scrolls sideways. Mobile only — on wider screens the
 * columns already fit — and it retires the moment the visitor scrolls.
 */
function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        // Zero-height so it rides the viewport bottom without taking space.
        "pointer-events-none sticky bottom-8 z-10 flex h-0 justify-center transition-opacity duration-300 sm:hidden",
        hidden && "opacity-0"
      )}
    >
      {/* Dark in both themes — it reads as an overlay on the board, not a card. */}
      <span className="flex -translate-y-full items-center gap-2 rounded-full bg-[#232939] px-5 py-4 font-mono text-sm text-[#f7f7f8] shadow-lg shadow-black/25 dark:bg-[#1d2230]">
        scroll sideways
        <ChevronsRight className="size-4 animate-nudge motion-reduce:animate-none" />
      </span>
    </div>
  )
}
