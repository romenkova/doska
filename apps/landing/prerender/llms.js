/**
 * https://llmstxt.org an index of the site in Markdown, for models that are
 * fetching it rather than crawling it.
 */
export function llms(site, { outline, links }) {
  const labelFor = (page) => {
    const parent = page.path.slice(0, page.path.lastIndexOf("/"))
    if (parent === "/docs") return page.nav // a section, not a page under one
    const section = outline.find((other) => other.path === parent)
    return section ? `${section.nav} / ${page.nav}` : page.nav
  }

  const lines = [
    "# Doska",
    "",
    "> An open-source, local-first Kanban board where every card is Markdown." +
      " Boards live in the browser and work offline, sync through a server you" +
      " host yourself, share with the other accounts on it or publish as a" +
      " read-only link, and are exposed over MCP so agents can edit them.",
    "",
    "Doska is free and MIT licensed.",
    "",
    "## Docs",
    "",
    ...outline.map(
      (page) =>
        `- [${labelFor(page)}](${site}${page.path}): ${page.description}`
    ),
    "",
    "## Optional",
    "",
    `- [Open the app](${links.app}): the board running in the browser, no signup.`,
    `- [Source](${links.repo}): the monorepo, issues and licence.`,
    `- [Releases](${links.releases}): desktop builds and changelog.`,
    "",
  ]

  return lines.join("\n")
}
