/**
 * Where a command may be triggered:
 * - `block`: only at the start of a line
 * - `inline`: anywhere
 */
export type SlashScope = "block" | "inline"

export interface SlashCommand {
  id: string
  title: string
  hint?: string
  keywords?: string[]
  scope?: SlashScope
  /**
   * Produces the text to insert at the caret. `$` marks the resulting caret
   * position; if omitted, the caret lands at the end of the snippet.
   */
  insert: string
}

/**
 * Default markdown slash commands. The `$` sentinel in `insert` marks where the
 * caret should end up after insertion (see `applyInsert`).
 */
export const DEFAULT_SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "todo",
    title: "To-do",
    hint: "Checkbox item",
    keywords: ["task", "checkbox", "x"],
    insert: "- [ ] $",
  },
  {
    id: "h1",
    title: "Heading 1",
    hint: "Large heading",
    keywords: ["title"],
    insert: "# $",
  },
  { id: "h2", title: "Heading 2", hint: "Medium heading", insert: "## $" },
  { id: "h3", title: "Heading 3", hint: "Small heading", insert: "### $" },
  {
    id: "quote",
    title: "Quote",
    hint: "Blockquote",
    keywords: ["q"],
    insert: "> $",
  },
  {
    id: "code",
    title: "Code block",
    hint: "Fenced code",
    keywords: ["pre"],
    insert: "```\n$\n```",
  },
  {
    id: "divider",
    title: "Divider",
    hint: "Horizontal rule",
    keywords: ["hr", "line"],
    insert: "---\n$",
  },
  { id: "cut", title: "Cut", hint: "End of card preview", insert: "-cut-\n$" },
  {
    id: "link",
    title: "Link",
    hint: "URL",
    keywords: ["url", "href", "a"],
    scope: "inline",
    insert: "[$](url)",
  },
]

/**
 * Filters commands by a query
 */
export function filterSlashCommands(
  commands: SlashCommand[],
  query: string,
  atLineStart: boolean
): SlashCommand[] {
  const q = query.trim().toLowerCase()
  return commands.filter((cmd) => {
    if (!atLineStart && (cmd.scope ?? "block") === "block") return false
    if (!q) return true
    if (cmd.title.toLowerCase().includes(q)) return true
    return cmd.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false
  })
}
