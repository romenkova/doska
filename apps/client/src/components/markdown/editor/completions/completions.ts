import { autocompletion, type CompletionSource } from "@codemirror/autocomplete"
import type { Extension } from "@codemirror/state"
import { tooltips } from "@codemirror/view"
import { menuKeymap } from "./menu-keymap"

export function completions(sources: CompletionSource[]): Extension {
  return [
    menuKeymap,
    autocompletion({
      override: sources,
      icons: false,
      tooltipClass: () => "font-sans shadow-e3",
    }),
    // Absolute keeps the menu inside the panel's stacking context
    tooltips({ position: "absolute" }),
  ]
}
