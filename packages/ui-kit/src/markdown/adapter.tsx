import { Fragment } from "react"
import { MdBlockquote } from "./blockquote"
import { MdCodeBlock } from "./code-block"
import { MdCutDivider } from "./cut-divider"
import { MdEmphasis } from "./emphasis"
import { MdFootnoteDef } from "./footnote-def"
import { MdFootnoteRef } from "./footnote-ref"
import { MdHeading } from "./heading"
import { MdImage } from "./image"
import { MdInlineCode } from "./inline-code"
import { MdLink } from "./link"
import { MdList } from "./list"
import { MdListItem } from "./list-item"
import { MdMark } from "./mark"
import { MdParagraph } from "./paragraph"
import { MdRawHtml } from "./raw-html"
import { MdRule } from "./rule"
import { MdStrikethrough } from "./strikethrough"
import { MdStrong } from "./strong"
import { MdTable } from "./table"
import { MdTableCell } from "./table-cell"
import { MdTaskItem } from "./task-item"
import { MdWikilink } from "./wikilink"
import { toAttachmentSrc } from "@doska/markdown"
import type { MarkdownAdapter, MarkdownRenderers } from "@doska/markdown"

export function createWebAdapter({
  renderImage,
  renderWikilink,
}: MarkdownRenderers): MarkdownAdapter {
  return {
    // ----------------------------------------------------------- blocks
    paragraph(runs, style, key) {
      const content = runs.flatMap((run) =>
        run.kind === "inline" ? run.children : [run.node]
      )
      // A tight list item's paragraph wrapper would add margins the HTML
      // pipeline never produced.
      if (style.tight) return <Fragment key={key}>{content}</Fragment>
      return (
        <MdParagraph key={key} muted={style.muted}>
          {content}
        </MdParagraph>
      )
    },

    heading(depth, children, id, key) {
      return (
        <MdHeading key={key} depth={depth} id={id}>
          {children}
        </MdHeading>
      )
    },

    list(ordered, start, items, key) {
      return (
        <MdList key={key} ordered={ordered} start={start}>
          {items}
        </MdList>
      )
    },

    listItem(marker, blocks, key) {
      if (marker.kind !== "task")
        return <MdListItem key={key}>{blocks}</MdListItem>
      return (
        <MdTaskItem
          key={key}
          checked={marker.checked}
          onToggle={marker.onToggle}
        >
          {blocks}
        </MdTaskItem>
      )
    },

    blockquote(blocks, key) {
      return <MdBlockquote key={key}>{blocks}</MdBlockquote>
    },

    code(value, lang, key) {
      return <MdCodeBlock key={key} value={value} lang={lang} />
    },

    thematicBreak(key) {
      return <MdRule key={key} />
    },

    table(head, body, key) {
      return (
        <MdTable key={key} head={head}>
          {body}
        </MdTable>
      )
    },

    tableRow(cells, _header, key) {
      return <tr key={key}>{cells}</tr>
    },

    tableCell(children, cell, key) {
      return (
        <MdTableCell key={key} header={cell.header} align={cell.align}>
          {children}
        </MdTableCell>
      )
    },

    html(value, key) {
      return <MdRawHtml key={key} value={value} />
    },

    footnoteDefinition(label, blocks, key) {
      return (
        <MdFootnoteDef key={key} label={label}>
          {blocks}
        </MdFootnoteDef>
      )
    },

    // ----------------------------------------------------------- inline
    text(value) {
      return value
    },

    lineBreak(key) {
      return <br key={key} />
    },

    strong(children, key) {
      return <MdStrong key={key}>{children}</MdStrong>
    },

    emphasis(children, key) {
      return <MdEmphasis key={key}>{children}</MdEmphasis>
    },

    strikethrough(children, key) {
      return <MdStrikethrough key={key}>{children}</MdStrikethrough>
    },

    mark(children, key) {
      return <MdMark key={key}>{children}</MdMark>
    },

    inlineCode(value, key) {
      return <MdInlineCode key={key}>{value}</MdInlineCode>
    },

    link(url, children, key) {
      return (
        <MdLink key={key} href={url}>
          {children}
        </MdLink>
      )
    },

    image(source, alt, _position, key) {
      if (source.kind === "attachment") {
        const custom = renderImage?.(source.key, alt)
        if (custom) return <Fragment key={key}>{custom}</Fragment>
        return <MdImage key={key} src={toAttachmentSrc(source.key)} alt={alt} />
      }
      return <MdImage key={key} src={source.url} alt={alt} />
    },

    wikilink(target, alias, key) {
      const custom = renderWikilink?.(target, alias)
      if (custom) return <Fragment key={key}>{custom}</Fragment>
      return <MdWikilink key={key} target={target} label={alias} />
    },

    cut(key) {
      return <MdCutDivider key={key} />
    },

    footnoteReference(label, key) {
      return <MdFootnoteRef key={key} label={label} />
    },
  }
}
