import { Button } from "@doska/ui-kit"
import { Download, ExternalLink } from "lucide-react"
import { SiGithub } from "react-icons/si"
import { app, releases, repo } from "./links"

export function Hero() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="pt-10 pb-10 sm:pt-16">
        <p className="mb-4 font-mono text-sm tracking-tight text-muted-foreground">
          Open source · local-first
        </p>
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
          A Kanban board where the cards are Markdown
        </h1>
        <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          It's local-first: your boards live in the browser, so it's fast and
          works without an account. Sync is opt-in — point it at a server you
          run and it keeps the canonical copy.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={app} />}
          >
            <ExternalLink className="size-4" />
            Open in browser
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={repo} />}
          >
            <SiGithub className="size-4" />
            View on GitHub
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={releases} />}
          >
            <Download className="size-4" />
            Download for macOS
          </Button>
        </div>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          ↓ the rest of this page is one of its boards. tick a box, copy an id.
        </p>
      </section>
    </main>
  )
}
