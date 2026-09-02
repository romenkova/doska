import type { ReactNode } from "react"
import type { ImageSource } from "./url"

/**
 * What a platform has to supply for `renderMarkdown` to draw a body: one method
 * per kind of node, returning that platform's components. Everything that is a
 * *rule* rather than a *look* — task numbering, list tightness, URL safety,
 * which `emphasis` nodes are really wikilinks — is settled by the
 * traversal before it gets here, so an adapter only decides appearance.
 *
 * Every method takes the React `key` its result must carry; the traversal
 * assigns them so sibling keys stay unique across a node's mixed children.
 */
export interface MarkdownAdapter {
  // ------------------------------------------------------------- blocks
  paragraph(runs: ParagraphRun[], style: ParagraphStyle, key: string): ReactNode
  /** `id` is the GitHub-style slug of the heading text, for in-page anchors. */
  heading(
    depth: number,
    children: ReactNode[],
    id: string,
    key: string
  ): ReactNode
  /** `start` is the first ordinal of an ordered list, else 1. */
  list(
    ordered: boolean,
    start: number,
    items: ReactNode[],
    key: string
  ): ReactNode
  listItem(marker: ListMarker, blocks: ReactNode[], key: string): ReactNode
  blockquote(blocks: ReactNode[], key: string): ReactNode
  code(value: string, lang: string | null, key: string): ReactNode
  thematicBreak(key: string): ReactNode
  /** `head` is the GFM header row, always present; `body` the rest. */
  table(head: ReactNode, body: ReactNode[], key: string): ReactNode
  tableRow(cells: ReactNode[], header: boolean, key: string): ReactNode
  tableCell(
    children: ReactNode[],
    cell: { header: boolean; align: Align; column: number },
    key: string
  ): ReactNode
  /** Raw HTML, which neither platform interprets. */
  html(value: string, key: string): ReactNode
  footnoteDefinition(label: string, blocks: ReactNode[], key: string): ReactNode

  // ------------------------------------------------------------- inline
  text(value: string): ReactNode
  lineBreak(key: string): ReactNode
  strong(children: ReactNode[], key: string): ReactNode
  emphasis(children: ReactNode[], key: string): ReactNode
  strikethrough(children: ReactNode[], key: string): ReactNode
  mark(children: ReactNode[], key: string): ReactNode
  inlineCode(value: string, key: string): ReactNode
  link(url: string, children: ReactNode[], key: string): ReactNode
  /**
   * `position` is "block" when the image stood alone in the text flow and was
   * lifted out of it, and "inline" when it sits among other content — where a
   * native adapter has nothing to put but the alt text.
   */
  image(
    source: ImageSource,
    alt: string,
    position: "block" | "inline",
    key: string
  ): ReactNode
  /** `alias` is the label written into the text, as in `[[12|Fix it]]`. */
  wikilink(target: string, alias: string | undefined, key: string): ReactNode
  cut(key: string): ReactNode
  footnoteReference(label: string, key: string): ReactNode
}

export type Align = "left" | "center" | "right" | null

/**
 * A paragraph split into stretches of inline content and the images between
 * them. React Native cannot nest a view inside a text node, so an image has to
 * be liftable out of the flow; a DOM adapter can simply concatenate the runs.
 */
export type ParagraphRun =
  { kind: "inline"; children: ReactNode[] } | { kind: "block"; node: ReactNode }

export interface ParagraphStyle {
  /** Inside a ticked task, whose text is dimmed. */
  muted: boolean
  /**
   * A direct child of a tight list item, where the paragraph wrapper should
   * disappear — matching what mdast-util-to-hast does on the way to HTML.
   */
  tight: boolean
}

/**
 * `onToggle` is absent when the checkbox is not interactive — either the caller
 * passed no handler, or the item is one the source-level task functions cannot
 * address (see `renderMarkdown`).
 */
export type ListMarker =
  | { kind: "bullet" }
  | { kind: "number"; value: number }
  | { kind: "task"; checked: boolean; onToggle?: () => void }
