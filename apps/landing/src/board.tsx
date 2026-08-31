import { useState } from "react"
import { ChevronsRight } from "lucide-react"
import { MarkdownRenderersProvider } from "@doska/markdown"
import { cn } from "@doska/ui-kit"
import { AttachmentPlaceholder } from "./attachment"
import { BoardCard } from "./board-card"
import { cards } from "./cards"
import { Column } from "./column"
import { McpTerminal } from "./terminal"
import { Wikilink } from "./wikilink"

const renderers = {
  renderImage: (_key: string, alt: string) => (
    <AttachmentPlaceholder alt={alt} />
  ),
  renderWikilink: (target: string) => <Wikilink target={target} />,
}

export function Board() {
  const [scrolled, setScrolled] = useState(false)

  return (
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
        <MarkdownRenderersProvider value={renderers}>
          <div className="mx-auto flex max-w-6xl items-start gap-5 px-4 py-8 sm:px-6">
            <Column title="Cards" color="violet">
              <BoardCard title="Cards are Markdown" body={cards.markdown} />
              <BoardCard title="Attachments" body={cards.attachments} />
              <BoardCard title="Cards link to cards" body={cards.refs} />
              <BoardCard title="Search the board" body={cards.search} />
              <BoardCard title="Columns or rows" body={cards.views} />
            </Column>

            <Column title="Where it lives" color="green">
              <BoardCard title="Local-first" body={cards.localFirst} />
              <BoardCard title="Sync with a folder" body={cards.vault} />
              <BoardCard title="Sync is opt-in" body={cards.sync} />
              <BoardCard
                title="Share a board with other users"
                body={cards.share}
              />
              <BoardCard title="Public sharing" body={cards.publicLink} />
              <BoardCard title="Deleting is reversible" body={cards.trash} />
            </Column>

            <Column title="Run it" color="amber">
              <BoardCard title="Self-host in one line" body={cards.selfHost} />
              <BoardCard
                title="Multiple accounts on one server"
                body={cards.accounts}
              />
              <BoardCard title="Runs where you do" body={cards.platforms} />
              <BoardCard title="Works on a phone" body={cards.phone} />
              <BoardCard title="MCP server" body={cards.agents}>
                <McpTerminal />
              </BoardCard>
            </Column>
          </div>
        </MarkdownRenderersProvider>
      </div>
      <ScrollHint hidden={scrolled} />
    </div>
  )
}

function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none sticky bottom-8 z-10 flex h-0 justify-center transition-opacity duration-300 sm:hidden",
        hidden && "opacity-0"
      )}
    >
      <span className="flex -translate-y-full items-center gap-2 rounded-full bg-[#232939] px-5 py-4 font-mono text-sm text-[#f7f7f8] shadow-lg shadow-black/25 dark:bg-[#1d2230]">
        scroll sideways
        <ChevronsRight className="size-4 animate-nudge motion-reduce:animate-none" />
      </span>
    </div>
  )
}
