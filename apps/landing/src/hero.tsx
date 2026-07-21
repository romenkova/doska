import { Button } from "@doska/ui-kit"
import { Download, ExternalLink } from "lucide-react"
import { SiGithub } from "react-icons/si"
import { app, author, releases, repo } from "./links"
import { Typewriter } from "./typewriter"

// Each reads as the tail of "A Kanban board …". The first is what SSR and
// reduced-motion visitors see, so it's the plainest of them.
const phrases = [
  "made of Markdown",
  "your agent can edit",
  "that works offline",
  "you can self-host",
]

export function Hero() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="pt-10 pb-10 sm:pt-16">
        <p className="mb-4 font-mono text-sm tracking-tight text-muted-foreground">
          Open source · local-first · by{" "}
          <a
            href={author}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            romenkova
          </a>
        </p>
        <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
          A Kanban board <Typewriter phrases={phrases} />
        </h1>
        <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Boards live in your browser, so the UI is instant and works offline.
          <br />
          For anything you want to keep, run the sync server you host yourself.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={app} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-4" />
            Open in browser
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={repo} target="_blank" rel="noreferrer" />}
          >
            <SiGithub className="size-4" />
            View on GitHub
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={releases} target="_blank" rel="noreferrer" />}
          >
            <Download className="size-4" />
            Download for macOS
          </Button>
        </div>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          ↓ this isn't a real board, just a bunch of features. but you can click
          around.
        </p>
      </section>
    </main>
  )
}
