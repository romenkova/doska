import { Button } from "@doska/ui-kit"
import { ExternalLink } from "lucide-react"
import { SiGithub } from "react-icons/si"
import { DevNotice } from "./dev-notice"
import { DownloadMenu } from "./download-menu"
import { app, repo } from "./links"

export function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="pt-10 pb-10 sm:pt-16">
        <p className="mb-4 font-mono text-sm tracking-tight text-muted-foreground">
          Open source · local-first
        </p>
        <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
          Kanban in a folder <br />
          of markdown files
        </h1>
        <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Works with no server. <br />
          Sync when you want it, to a server you own.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="plausible-event-name=CTA+App h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={app} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-4" />
            Open in browser
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="plausible-event-name=CTA+GitHub h-11 w-full gap-2 px-5 text-base sm:w-auto"
            render={<a href={repo} target="_blank" rel="noreferrer" />}
          >
            <SiGithub className="size-4" />
            View on GitHub
          </Button>
          <DownloadMenu />
        </div>
        <DevNotice />
      </section>
    </div>
  )
}
