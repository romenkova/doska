import { PanelLeft } from "lucide-react"
import { Button, cn } from "@doska/ui-kit"
import { depth, docs, type DocPage } from "./pages"

export function DocsNav({ current }: { current: DocPage }) {
  return (
    <>
      <DocsDrawer current={current} />
      <nav className="hidden md:block md:w-52 md:shrink-0">
        <div className="sticky top-20">
          <DocsLinks current={current} />
        </div>
      </nav>
    </>
  )
}

function DocsDrawer({ current }: { current: DocPage }) {
  return (
    <div className="mb-6 md:hidden">
      <Button
        variant="muted"
        className="h-10 w-full justify-between gap-2 px-3"
        data-drawer-open
      >
        <span className="flex items-center gap-1.5">
          <PanelLeft className="size-4" />
          <span className="text-muted-foreground">Docs</span>
        </span>
        <span className="font-semibold">{current.nav}</span>
      </Button>
      <dialog
        className="m-0 h-full max-h-none w-3/4 border-r bg-popover text-sm text-popover-foreground shadow-e3 backdrop:bg-black/10 backdrop:supports-backdrop-filter:backdrop-blur-xs sm:max-w-sm"
        data-drawer
      >
        <div className="flex h-full flex-col">
          <div className="p-4 text-base font-medium text-foreground">
            Documentation
          </div>
          <div className="overflow-y-auto px-2 pb-4">
            <DocsLinks current={current} />
          </div>
        </div>
      </dialog>
    </div>
  )
}

function DocsLinks({ current }: { current: DocPage }) {
  return (
    <ul className="flex flex-col gap-1">
      {docs.map((doc) => (
        <li key={doc.path} className={cn(depth(doc) > 1 && "ml-4")}>
          <a
            href={doc.path}
            aria-current={doc === current ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-docs-nav transition-colors hover:bg-muted hover:text-foreground",
              doc === current && "bg-muted font-semibold text-foreground"
            )}
          >
            {doc.nav}
            {doc.badge && (
              <span className="rounded-sm border border-current px-1 text-[10px] font-medium tracking-wide uppercase opacity-70">
                {doc.badge}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
