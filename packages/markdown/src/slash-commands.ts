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
    id: "tag",
    title: "Tag",
    hint: "Label the card",
    keywords: ["label", "hash", "#"],
    scope: "inline",
    insert: "#$",
  },
  {
    id: "link",
    title: "Link",
    hint: "URL",
    keywords: ["url", "href", "a"],
    scope: "inline",
    insert: "[$](url)",
  },
]

// A `/` at the start of input or right after whitespace, followed by the query
// (any non-whitespace run) up to the caret.
export const SLASH_TRIGGER = /(?:^|\s)\/(\S*)$/

export interface SlashTrigger {
  /** Index of the `/` itself. */
  start: number
  query: string
  atLineStart: boolean
}

/** The `/` trigger the caret sits in, or null when there is none. */
export function matchSlashTrigger(
  value: string,
  caret: number
): SlashTrigger | null {
  const before = value.slice(0, caret)
  const match = SLASH_TRIGGER.exec(before)
  if (!match) return null

  const start = caret - match[1].length - 1
  return { start, query: match[1], atLineStart: isLineStart(value, start) }
}

/** Nothing but whitespace since the previous line break, which block commands require. */
export function isLineStart(value: string, index: number): boolean {
  const lineStart = value.lastIndexOf("\n", index - 1) + 1
  return value.slice(lineStart, index).trim() === ""
}

/**
 * A command inserted with no typed trigger, from a toolbar or a floating
 * button. A block command mid-line is pushed onto a fresh line, so the markdown
 * stays valid.
 */
export function untriggeredInsert(
  command: SlashCommand,
  value: string,
  caret: number
): { text: string; caretOffset: number } {
  const atLineStart = caret === 0 || value[caret - 1] === "\n"
  const prefix =
    (command.scope ?? "block") === "block" && !atLineStart ? "\n" : ""
  const { text, caretOffset } = applyInsert(command.insert)
  return { text: prefix + text, caretOffset: prefix.length + caretOffset }
}

/** Splits an `insert` template on the `$` caret sentinel. */
export function applyInsert(insert: string): {
  text: string
  caretOffset: number
} {
  const i = insert.indexOf("$")
  if (i === -1) return { text: insert, caretOffset: insert.length }
  return { text: insert.slice(0, i) + insert.slice(i + 1), caretOffset: i }
}

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
