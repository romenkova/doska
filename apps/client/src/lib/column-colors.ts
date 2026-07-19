export interface ColumnColor {
  /** Stored on the column; stable, so renaming a label never re-colors a board. */
  id: string
  label: string
  /** oklch hue, fed to `--column-h` / `--wikilink-h` by whatever renders it. */
  hue: number
}

/**
 * The colors a column can be tinted with. Hues only — each surface picks its
 * own lightness and chroma so a pill, a dot and a header accent stay legible
 * in both themes. A column with no color (`""`) renders neutral.
 */
export const COLUMN_COLORS: ColumnColor[] = [
  { id: "blue", label: "Blue", hue: 240 },
  { id: "violet", label: "Violet", hue: 285 },
  { id: "magenta", label: "Magenta", hue: 320 },
  { id: "rose", label: "Rose", hue: 10 },
  { id: "amber", label: "Amber", hue: 70 },
  { id: "green", label: "Green", hue: 145 },
  { id: "teal", label: "Teal", hue: 195 },
]

/** The hue for a stored color id, or null when unset or no longer in the palette. */
export function columnHue(color: string): number | null {
  return COLUMN_COLORS.find((c) => c.id === color)?.hue ?? null
}
