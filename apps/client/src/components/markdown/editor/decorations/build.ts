import { CUT_RE } from "@doska/markdown"
import { syntaxTree } from "@codemirror/language"
import { RangeSetBuilder } from "@codemirror/state"
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view"
import { normalizeTarget, wikilinkTargets } from "./wikilink-targets"

const LINE_PREFIX = /^(\s*(?:(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s*)?)?)/
const DONE_TASK = /^\s*[-*+]\s+\[[xX]\]\s*/

const cutLine = Decoration.line({ class: "cm-cut" })
const done = Decoration.mark({ class: "cm-done" })
const live = Decoration.mark({ class: "cm-wikilink" })
const broken = Decoration.mark({ class: "cm-wikilink-broken" })

function hangingIndent(chars: number) {
  return Decoration.line({
    attributes: { style: `padding-left:${chars}ch;text-indent:-${chars}ch` },
  })
}

/** Decorations for the visible lines: hanging indents, the cut line, ticked tasks, wikilinks. */
export function build(view: EditorView): DecorationSet {
  const targets = view.state.facet(wikilinkTargets)
  const builder = new RangeSetBuilder<Decoration>()
  const tree = syntaxTree(view.state)

  for (const { from, to } of view.visibleRanges) {
    let pos = from
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos)
      const prefix = LINE_PREFIX.exec(line.text)?.[1] ?? ""
      if (prefix.length > 0)
        builder.add(line.from, line.from, hangingIndent(prefix.length))
      if (CUT_RE.test(line.text)) builder.add(line.from, line.from, cutLine)

      const doneTask = DONE_TASK.exec(line.text)
      if (doneTask && doneTask[0].length < line.length)
        builder.add(line.from + doneTask[0].length, line.to, done)

      tree.iterate({
        from: line.from,
        to: line.to,
        enter(node) {
          if (node.name !== "WikilinkTarget") return
          const target = view.state.doc.sliceString(node.from, node.to)
          const resolves =
            targets.size === 0 || targets.has(normalizeTarget(target))
          builder.add(node.from, node.to, resolves ? live : broken)
        },
      })
      pos = line.to + 1
    }
  }
  return builder.finish()
}
