import type { Root } from "mdast"
import type { ReactNode } from "react"
import { markdownExtra, type MdNode } from "./parse"
import { imageSource, linkUrl, type ImageSource } from "./url"
import type {
  Align,
  ListMarker,
  MarkdownAdapter,
  ParagraphRun,
} from "./adapter"

export interface RenderOptions {
  /**
   * Makes task-list checkboxes interactive. Called with the checkbox's 0-based
   * index in document order, matching `taskProgress` / `toggleTaskByIndex`.
   */
  onToggleTask?: (index: number) => void
}

interface Ctx {
  adapter: MarkdownAdapter
  definitions: Map<string, { url: string; alt: string }>
  onToggleTask?: (index: number) => void
  /**
   * Running count of addressable task checkboxes. Mutated during the pass and
   * created fresh for each one, so a double render (StrictMode, concurrent)
   * recounts from zero rather than continuing.
   */
  tasks: { seen: number }
  muted: boolean
  tight: boolean
  /** Inside a blockquote, which `TASK_RE` cannot match — see `renderListItem`. */
  quoted: boolean
}

/** Nested blocks never inherit a list item's tightness; only its own children do. */
function nested(ctx: Ctx): Ctx {
  return ctx.tight ? { ...ctx, tight: false } : ctx
}

function collectDefinitions(node: MdNode, into: Ctx["definitions"]) {
  if (node.type === "definition" && node.identifier)
    into.set(node.identifier, {
      url: node.url ?? "",
      alt: node.title ?? "",
    })
  for (const child of node.children ?? []) collectDefinitions(child, into)
}

function isBlank(node: MdNode): boolean {
  return node.type === "text" && !node.value?.trim()
}

/** The plain text of a subtree, for nodes rendered as a single flat label. */
function flatten(node: MdNode): string {
  if (node.value) return node.value
  return (node.children ?? []).map(flatten).join("")
}

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to dashes. */
function slug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
}

// ---------------------------------------------------------------- inline

function renderInline(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const { adapter } = ctx

  switch (node.type) {
    case "text":
      return adapter.text(node.value ?? "")
    case "break":
      return adapter.lineBreak(key)
    case "strong":
      return adapter.strong(renderInlines(node.children, ctx), key)
    case "delete":
      return adapter.strikethrough(renderInlines(node.children, ctx), key)
    case "mark":
      return adapter.mark(renderInlines(node.children, ctx), key)
    case "inlineCode":
      return adapter.inlineCode(node.value ?? "", key)
    case "html":
      return adapter.html(node.value ?? "", key)

    case "link":
      return adapter.link(
        linkUrl(node.url ?? ""),
        renderInlines(node.children, ctx),
        key
      )

    case "linkReference": {
      const definition = ctx.definitions.get(node.identifier ?? "")
      const children = renderInlines(node.children, ctx)
      if (!definition) return adapter.text(`[${flatten(node)}]`)
      return adapter.link(linkUrl(definition.url), children, key)
    }

    case "image":
    case "imageReference": {
      const image = resolveImage(node, ctx)
      if (!image) return adapter.text(`![${node.alt ?? ""}]`)
      return adapter.image(image.source, image.alt, "inline", key)
    }

    case "footnoteReference":
      return adapter.footnoteReference(node.label ?? node.identifier ?? "", key)

    case "emphasis": {
      const extra = markdownExtra(node)
      if (extra?.kind === "wikilink")
        return adapter.wikilink(extra.target, extra.alias, key)
      if (extra?.kind === "cut") return adapter.cut(key)
      return adapter.emphasis(renderInlines(node.children, ctx), key)
    }

    default:
      return node.children
        ? adapter.emphasis(renderInlines(node.children, ctx), key)
        : adapter.text(node.value ?? "")
  }
}

function renderInlines(children: MdNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (children ?? []).map((child, i) => renderInline(child, ctx, String(i)))
}

// ---------------------------------------------------------------- blocks

/** The image a node points at, or null if it is a reference with no definition. */
function resolveImage(
  node: MdNode,
  ctx: Ctx
): { source: ImageSource; alt: string } | null {
  const alt = node.alt ?? ""
  if (node.type === "image") return { source: imageSource(node.url), alt }

  const definition = ctx.definitions.get(node.identifier ?? "")
  if (!definition) return null
  return { source: imageSource(definition.url), alt }
}

/**
 * Images parse as inline nodes but read as blocks, so a paragraph becomes runs
 * of inline content with the images lifted out between them.
 */
function renderParagraph(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const runs: ParagraphRun[] = []
  let run: { node: MdNode; index: number }[] = []

  const flushRun = () => {
    if (!run.every((entry) => isBlank(entry.node)))
      runs.push({
        kind: "inline",
        children: run.map((entry) =>
          renderInline(entry.node, ctx, String(entry.index))
        ),
      })
    run = []
  }

  const children = node.children ?? []
  children.forEach((child, index) => {
    const image =
      child.type === "image" || child.type === "imageReference"
        ? resolveImage(child, ctx)
        : null

    if (image) {
      flushRun()
      runs.push({
        kind: "block",
        node: ctx.adapter.image(
          image.source,
          image.alt,
          "block",
          String(index)
        ),
      })
    } else {
      run.push({ node: child, index })
    }
  })
  flushRun()

  if (runs.length === 0) return null
  return ctx.adapter.paragraph(
    runs,
    { muted: ctx.muted, tight: ctx.tight },
    key
  )
}

function renderListItem(
  item: MdNode,
  ctx: Ctx,
  list: { ordered: boolean; number: number; spread: boolean },
  key: string
): ReactNode {
  const isTask = item.checked != null
  // A task index only means something if `TASK_RE` in task-progress.ts sees the
  // same checkbox: it matches neither ordered items nor anything behind a `>`.
  // Such a checkbox must not consume an index, or every task after it would
  // address the wrong line — it renders, read-only.
  const addressable = isTask && !list.ordered && !ctx.quoted
  const index = addressable ? ctx.tasks.seen++ : null

  let marker: ListMarker
  if (isTask) {
    const toggle = ctx.onToggleTask
    marker = {
      kind: "task",
      checked: item.checked === true,
      onToggle: index !== null && toggle ? () => toggle(index) : undefined,
    }
  } else if (list.ordered) {
    marker = { kind: "number", value: list.number }
  } else {
    marker = { kind: "bullet" }
  }

  // A loose list makes every item loose, matching mdast-util-to-hast — which is
  // what decides whether the HTML pipeline wrapped item content in a <p>.
  const loose = list.spread || item.spread === true
  const itemCtx: Ctx = {
    ...ctx,
    tight: !loose,
    muted: ctx.muted || item.checked === true,
  }

  return ctx.adapter.listItem(marker, renderBlocks(item.children, itemCtx), key)
}

function renderTable(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const rows = node.children ?? []
  const inner = nested(ctx)

  const renderRow = (row: MdNode, header: boolean, rowKey: string) =>
    ctx.adapter.tableRow(
      (row.children ?? []).map((cell, c) =>
        ctx.adapter.tableCell(
          renderInlines(cell.children, inner),
          { header, align: (node.align?.[c] ?? null) as Align, column: c },
          String(c)
        )
      ),
      header,
      rowKey
    )

  const [head, ...body] = rows
  return ctx.adapter.table(
    head ? renderRow(head, true, "head") : null,
    body.map((row, r) => renderRow(row, false, String(r))),
    key
  )
}

function renderBlock(node: MdNode, ctx: Ctx, key: string): ReactNode {
  const { adapter } = ctx

  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, ctx, key)

    case "heading":
      return adapter.heading(
        node.depth ?? 1,
        renderInlines(node.children, nested(ctx)),
        slug(flatten(node)),
        key
      )

    case "list": {
      const ordered = node.ordered === true
      const start = node.start ?? 1
      const spread = node.spread === true
      return adapter.list(
        ordered,
        start,
        (node.children ?? []).map((item, i) =>
          renderListItem(
            item,
            nested(ctx),
            { ordered, number: start + i, spread },
            String(i)
          )
        ),
        key
      )
    }

    case "blockquote":
      return adapter.blockquote(
        renderBlocks(node.children, { ...nested(ctx), quoted: true }),
        key
      )

    case "code":
      return adapter.code(node.value ?? "", node.lang ?? null, key)

    case "thematicBreak":
      return adapter.thematicBreak(key)

    case "table":
      return renderTable(node, ctx, key)

    case "html":
      return adapter.html(node.value ?? "", key)

    case "footnoteDefinition":
      return adapter.footnoteDefinition(
        node.label ?? node.identifier ?? "",
        renderBlocks(node.children, nested(ctx)),
        key
      )

    // Link/image definitions are resolved into their references, not drawn.
    case "definition":
      return null

    default:
      return renderParagraph(node, ctx, key)
  }
}

function renderBlocks(nodes: MdNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes ?? [])
    .map((node, i) => renderBlock(node, ctx, String(i)))
    .filter((node) => node !== null)
}

// ---------------------------------------------------------------- entry

/**
 * Walks a parsed body once and hands each node to `adapter`. This is where the
 * behaviour shared by every platform lives — anything a web and a native
 * renderer must agree on belongs here rather than in either adapter.
 */
export function renderMarkdown(
  root: Root,
  adapter: MarkdownAdapter,
  options: RenderOptions = {}
): ReactNode[] {
  const definitions: Ctx["definitions"] = new Map()
  collectDefinitions(root as MdNode, definitions)

  const ctx: Ctx = {
    adapter,
    definitions,
    onToggleTask: options.onToggleTask,
    tasks: { seen: 0 },
    muted: false,
    tight: false,
    quoted: false,
  }

  return renderBlocks((root as MdNode).children, ctx)
}
