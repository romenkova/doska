import { useMemo } from "react"
import type { Marker, MarkerVariant } from "./types"

export interface UseMarkersResult {
  /** The body after all markers have been applied in order. */
  body: string
  /** The names of the markers that were actually applied. */
  applied: string[]
}

/** Applies an array of markers to a body, returning the result and which markers applied. */
export function useMarkers(
  body: string,
  markers: Marker[],
  variant: MarkerVariant
): UseMarkersResult {
  return useMemo(() => {
    const applied: string[] = []
    let result = body
    for (const marker of markers) {
      const render =
        variant === "card" ? marker.cardRender : marker.previewRender
      const { body: next, applied: wasApplied } = render(result)
      result = next
      if (wasApplied) applied.push(marker.name)
    }
    return { body: result, applied }
  }, [body, markers, variant])
}
