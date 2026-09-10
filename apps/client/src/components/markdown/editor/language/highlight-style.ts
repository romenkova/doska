import { HighlightStyle } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"
import { markTag } from "./mark"

const MUTED = "color-mix(in oklab, var(--muted-foreground) 60%, transparent)"

export const highlightStyle = HighlightStyle.define([
  { tag: t.heading, fontWeight: "bold" },
  { tag: t.strong, fontWeight: "600" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: t.link, color: "var(--primary)" },
  {
    tag: markTag,
    borderRadius: "0.2em",
    backgroundColor: "oklch(0.69 0.17 286.88 / 0.3)",
  },
  {
    tag: [t.processingInstruction, t.url, t.contentSeparator, t.labelName],
    color: MUTED,
  },
])
