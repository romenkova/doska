export interface MarkerResult {
  /** The transformed body to render. */
  body: string
  /** Whether the marker was present and applied. */
  applied: boolean
}

export type MarkerVariant = "card" | "preview"

export interface Marker {
  name: string
  /** Transforms the body for the compact board card view. */
  cardRender: (body: string) => MarkerResult
  /** Transforms the body for the full preview modal. */
  previewRender: (body: string) => MarkerResult
}
