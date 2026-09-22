import { syntaxTree } from "@codemirror/language"
import type { Extension } from "@codemirror/state"
import {
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view"
import { build } from "./build"
import { wikilinkTargets } from "./wikilink-targets"

/** Rebuilds the line decorations on change. */
export function decorations(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = build(view)
      }
      update(update: ViewUpdate) {
        const treeChanged =
          syntaxTree(update.startState) !== syntaxTree(update.state)
        const targetsChanged =
          update.startState.facet(wikilinkTargets) !==
          update.state.facet(wikilinkTargets)
        if (
          update.docChanged ||
          update.viewportChanged ||
          treeChanged ||
          targetsChanged
        )
          this.decorations = build(update.view)
      }
    },
    { decorations: (plugin) => plugin.decorations }
  )
}
