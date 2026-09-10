import type { Completion, CompletionSource } from "@codemirror/autocomplete"
import {
  applyInsert,
  filterSlashCommands,
  matchSlashTrigger,
  type SlashCommand,
} from "@doska/markdown"
import { insertAt } from "./insert-at"

/**
 * The `/` command menu
 */
export function slashCompletion(
  getCommands: () => SlashCommand[]
): CompletionSource {
  return (ctx) => {
    const line = ctx.state.doc.lineAt(ctx.pos)
    const trigger = matchSlashTrigger(line.text, ctx.pos - line.from)
    if (!trigger) return null
    const options = filterSlashCommands(
      getCommands(),
      trigger.query,
      trigger.atLineStart
    ).map((command): Completion => ({
      label: command.title,
      detail: command.hint,
      apply: (view, _completion, from, to) => {
        const { text, caretOffset } = applyInsert(command.insert)
        insertAt(view, from, to, text, caretOffset)
      },
    }))
    if (options.length === 0) return null
    return { from: line.from + trigger.start, options, filter: false }
  }
}
