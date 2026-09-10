import {
  acceptCompletion,
  closeCompletion,
  completionStatus,
} from "@codemirror/autocomplete"
import { Prec } from "@codemirror/state"
import { keymap } from "@codemirror/view"

/**
 * Tab accepts. Escape closes the menu only. Enter works by default
 */
export const menuKeymap = Prec.highest(
  keymap.of([
    { key: "Tab", run: acceptCompletion },
    {
      key: "Escape",
      stopPropagation: true,
      run: (view) =>
        completionStatus(view.state) === "active" && closeCompletion(view),
    },
  ])
)
