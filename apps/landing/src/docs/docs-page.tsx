import { Markdown } from "@doska/ui-kit"
import { DocsNav } from "./docs-nav"
import { DocsSteps } from "./docs-steps"
import type { DocPage } from "./pages"

export function DocsPage({ page }: { page: DocPage }) {
  return (
    <div className="mx-auto max-w-6xl gap-10 px-4 py-10 sm:px-6 md:flex">
      <DocsNav current={page} />
      <article className="min-w-0 flex-1 pb-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
          {page.description}
        </p>
        <Markdown className="docs-prose mt-8 max-w-2xl">{page.body}</Markdown>
        <DocsSteps current={page} />
      </article>
    </div>
  )
}
