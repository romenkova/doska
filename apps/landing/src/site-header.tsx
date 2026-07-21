import { Button } from "@doska/ui-kit"
import { SiGithub } from "react-icons/si"
import { repo } from "./links"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" className="size-7" />
          Doska
        </a>
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="outline"
            className="ml-2 h-9 gap-2 px-4"
            render={<a href={repo} />}
          >
            <SiGithub className="size-4" />
            GitHub
          </Button>
        </nav>
      </div>
    </header>
  )
}
