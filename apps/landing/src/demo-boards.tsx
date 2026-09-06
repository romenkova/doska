import { ArrowUpRight } from "lucide-react"

const boards = [
  {
    title: "Product roadmap",
    note: "Features, releases, bugfixes",
    href: "https://app.doska.sh/p/c941951c0ac518ff127f22fa72434b8a",
  },
  {
    title: "Trip inspiration",
    note: "Places to visit",
    href: "https://app.doska.sh/p/eea7fd332a6a268bc12dd41e3861ab54",
  },
]

export function DemoBoards() {
  return (
    <div className="min-w-0 flex-1 flex-col">
      <div className="text-xl font-extrabold">Demo public boards</div>
      <p className="text-muted-foreground">
        Boards can be marked as public to make them accessible via a link
        without signing in.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {boards.map((board) => (
          <a
            key={board.title}
            href={board.href}
            target="_blank"
            rel="noreferrer"
            className="group flex max-w-md flex-col gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{board.title}</div>
                <p className="truncate text-sm text-muted-foreground">
                  {board.note}
                </p>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
