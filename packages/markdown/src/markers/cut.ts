import type { Marker } from "./types"

// Matches a line containing only the cut marker (optionally surrounded by whitespace).
const CUT_RE = /^[ \t]*-cut-[ \t]*$/m

/**
 * Marker that ends the visible area of a card body in board view.
 *
 * - In the card view, renders only the content before the `-cut-` marker line.
 * - In the preview modal, renders the full body with the marker line replaced
 *   by a horizontal divider so the cut point stays visible.
 */
export const cut: Marker = {
  name: "cut",
  cardRender: (body) => {
    const match = CUT_RE.exec(body)
    if (!match) return { body, applied: false }
    return { body: body.slice(0, match.index).trimEnd(), applied: true }
  },
  previewRender: (body) => {
    if (!CUT_RE.test(body)) return { body, applied: false }
    return { body: body.replace(CUT_RE, "---"), applied: true }
  },
}
