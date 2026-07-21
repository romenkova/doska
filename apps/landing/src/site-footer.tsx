import { repo } from "./links"

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm">
      <span className="text-muted-foreground">Doska. MIT licensed. 2026</span>
      <a
        href={repo}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        Source
      </a>
    </footer>
  )
}
