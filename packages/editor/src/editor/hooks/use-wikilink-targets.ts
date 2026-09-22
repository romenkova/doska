import type { Compartment } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"
import { useEffect } from "react"
import type { WikilinkOption } from "@doska/markdown"
import { normalizeTarget, wikilinkTargets } from "../decorations"

/** Tells the decorations which `[[targets]]` resolve, so broken ones can be marked. */
export function useWikilinkTargets(
  view: EditorView | null,
  compartment: Compartment,
  wikilinks: WikilinkOption[] | undefined
) {
  const key = wikilinks
    ?.map((option) => normalizeTarget(option.target))
    .join("\n")

  useEffect(() => {
    if (!view || key === undefined) return
    const targets = new Set(key.split("\n").filter(Boolean))
    view.dispatch({
      effects: compartment.reconfigure(wikilinkTargets.of(targets)),
    })
  }, [view, compartment, key])
}
