import type { Completion, CompletionSource } from "@codemirror/autocomplete"
import { matchPrefixTrigger, type PrefixOption } from "@doska/markdown"
import { rankBy } from "@doska/core/search"
import { insertAt } from "./insert-at"

/**
 * The menu after a prefix — `#` for tags, `@` for people.
 */
export function prefixCompletion(
  prefix: string,
  getOptions: () => PrefixOption[]
): CompletionSource {
  return (ctx) => {
    const line = ctx.state.doc.lineAt(ctx.pos)
    const trigger = matchPrefixTrigger(line.text, ctx.pos - line.from, prefix)
    if (!trigger) return null
    const query = trigger.query.toLowerCase()
    const options = getOptions()

    if (options.some((option) => option.name.toLowerCase() === query))
      return null

    const ranked = rankBy(options, trigger.query, (option) => ({
      title: option.name,
    }))
    if (ranked.length === 0) return null

    return {
      from: line.from + trigger.start,
      filter: false,
      options: ranked.map(({ item }): Completion => ({
        label: `${prefix}${item.name}`,
        detail: item.hint,
        apply: (view, _completion, from, to) => {
          const text = `${prefix}${item.name} `
          insertAt(view, from, to, text, text.length)
        },
      })),
    }
  }
}
