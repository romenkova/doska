import { Button } from "@doska/ui-kit"
import { SiGithub } from "react-icons/si"
import { docs, repo } from "./links"
import { ThemeToggle } from "./theme-toggle"
import { BookOpenText } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 font-bold">
          <img src="/favicon.svg" alt="Doska" className="size-7" />
          <span className="hidden sm:inline">Doska</span>
        </a>
        <nav className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            nativeButton={false}
            className="plausible-event-name=Nav+Docs h-9 gap-2 px-3 sm:px-4"
            render={<a href={docs} target="_blank" rel="noreferrer" />}
          >
            <BookOpenText className="size-4" />
            Docs
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            nativeButton={false}
            className="plausible-event-name=Nav+GitHub h-9 gap-2 px-3 sm:px-4"
            render={<a href={repo} target="_blank" rel="noreferrer" />}
          >
            <SiGithub className="size-4.5" />
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
