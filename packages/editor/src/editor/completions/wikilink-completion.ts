import type { Completion, CompletionSource } from "@codemirror/autocomplete"
import {
  matchWikilinkTrigger,
  toWikilink,
  type WikilinkOption,
} from "@doska/markdown"
import { rankBy } from "@doska/core/search"
import { insertAt } from "./insert-at"

/**
 * The `[[` card menu.
 */
export function wikilinkCompletion(
  getOptions: () => WikilinkOption[]
): CompletionSource {
  return (ctx) => {
    const line = ctx.state.doc.lineAt(ctx.pos)
    const trigger = matchWikilinkTrigger(line.text, ctx.pos - line.from)
    if (!trigger) return null
    const ranked = rankBy(getOptions(), trigger.query, (option) => ({
      number: option.target.slice(option.target.lastIndexOf("-") + 1),
      title: option.title,
    }))
    if (ranked.length === 0) return null
    return {
      from: line.from + trigger.start,
      filter: false,
      options: ranked.map(({ item }): Completion => ({
        label: item.title,
        detail: item.hint,
        apply: (view, _completion, from, to) => {
          // Auto-closed brackets leave `]]` after the caret.
          const closing =
            view.state.doc.sliceString(to, to + 2) === "]]" ? 2 : 0
          const text = toWikilink(item.target, item.title)
          insertAt(view, from, to + closing, text, text.length)
        },
      })),
    }
  }
}
