import { EditorView } from "@codemirror/view"

const MUTED = "color-mix(in oklab, var(--muted-foreground) 60%, transparent)"

/**
 * Strips CodeMirror's chrome so the editor reads as plain text in the app's
 * font, and fills its container so a click anywhere in it lands in the text.
 */
export const theme = EditorView.theme({
  "&": { flex: "1 1 auto", backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    flex: "1 1 auto",
    fontFamily: "inherit",
    lineHeight: "inherit",
    overflow: "visible",
  },
  ".cm-content": { padding: "0", caretColor: "var(--foreground)" },
  ".cm-line": { padding: "0" },
  ".cm-placeholder": { color: "var(--muted-foreground)", opacity: "0.5" },
  ".cm-cut": { color: MUTED },
  ".cm-done": { color: "var(--muted-foreground)" },
  ".cm-wikilink": { color: "var(--primary)" },
  ".cm-wikilink-broken": {
    color: "var(--muted-foreground)",
    textDecoration: "underline dashed",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    overflow: "hidden",
    "& > ul": {
      fontFamily: "inherit",
      fontSize: "0.875rem",
      width: "17.5rem",
      minWidth: "0",
      maxHeight: "16rem",
      padding: "0.25rem 0",
    },
    "& > ul > li": {
      display: "flex",
      alignItems: "baseline",
      gap: "0.5rem",
      padding: "0.375rem 0.75rem",
      lineHeight: "1.25rem",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "var(--accent)",
      color: "var(--accent-foreground)",
    },
    "& .cm-completionLabel": {
      fontWeight: "500",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .cm-completionDetail": {
      flexShrink: "0",
      margin: "0",
      fontSize: "0.75rem",
      fontStyle: "normal",
      color: "var(--muted-foreground)",
    },
  },
})
