import type { CSSProperties } from "react"
import { columnHue } from "@doska/ui-kit"

/**
 * A `[[CARD-1]]` reference, rendered with the app's own markup and styles.
 * Static here — in the app the title and column are read live from the card.
 */
export function Wikilink({
  target,
  title,
  column,
  color,
}: {
  target: string
  title: string
  column: string
  color: string
}) {
  return (
    <span className="wikilink" title={`${title} — ${column}`}>
      <span className="wikilink-target">{target}</span>
      <span className="wikilink-label">{title}</span>
      <span
        className="wikilink-badge wikilink-badge-tinted"
        style={{ "--wikilink-h": columnHue(color) } as CSSProperties}
      >
        {column}
      </span>
    </span>
  )
}
