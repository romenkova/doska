import type { Root } from "mdast"
import remarkGfm from "remark-gfm"
import { remarkMark } from "remark-mark-highlight"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { remarkCut } from "../plugins/remark-cut"
import { remarkTags } from "../plugins/remark-tags"
import { remarkWikilinks } from "../plugins/remark-wikilinks"

/**
 * Every plugin here is a plain tree transform, so the pipeline stops at mdast
 * and each platform walks the same tree — see `renderMarkdown`.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMark)
  .use(remarkCut)
  .use(remarkWikilinks)
  .use(remarkTags)

export function parseMarkdown(markdown: string): Root {
  return processor.runSync(processor.parse(markdown))
}

/**
 * Permissive mdast shape. The real `mdast` unions do not know about the `mark`
 * node `remarkMark` adds, and the traversal dispatches on `type` anyway.
 */
export interface MdNode {
  type: string
  value?: string
  url?: string
  alt?: string | null
  title?: string | null
  identifier?: string
  label?: string | null
  depth?: number
  ordered?: boolean | null
  start?: number | null
  spread?: boolean | null
  checked?: boolean | null
  lang?: string | null
  align?: (string | null)[]
  children?: MdNode[]
  data?: unknown
}

/**
 * The extra node types the custom plugins introduce. They ride on `emphasis`
 * nodes tagged with `data.hProperties`, so a renderer checks for these before
 * treating an `emphasis` as italics.
 */
export type MarkdownExtra =
  | { kind: "wikilink"; target: string; alias?: string }
  | { kind: "tag"; name: string }
  | { kind: "cut" }
  | null

export function markdownExtra(node: { data?: unknown }): MarkdownExtra {
  const properties = (
    node.data as { hProperties?: Record<string, unknown> } | undefined
  )?.hProperties
  if (!properties) return null

  const target = properties.dataWikilink
  if (typeof target === "string") {
    const alias = properties.dataWikilinkAlias
    return {
      kind: "wikilink",
      target,
      alias: typeof alias === "string" ? alias : undefined,
    }
  }

  const name = properties.dataTag
  if (typeof name === "string") return { kind: "tag", name }

  const className = properties.className
  const names = Array.isArray(className) ? className : []
  if (names.includes("cut-divider")) return { kind: "cut" }

  return null
}
