import { useCallback } from "react"
import { useTriggerMenu, type Insertion } from "../menu"
import {
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  type SlashCommand,
} from "./commands"

// A `/` at the start of input or right after whitespace, followed by the query
// (any non-whitespace run) up to the caret.
const TRIGGER_RE = /(?:^|\s)\/(\S*)$/

interface Options {
  value: string
  onChangeValue: (value: string) => void
  commands?: SlashCommand[]
  enabled?: boolean
}

/** Splits an `insert` template on the `$` caret sentinel. */
function applyInsert(insert: string): Insertion {
  const i = insert.indexOf("$")
  if (i === -1) return { text: insert, caretOffset: insert.length }
  return { text: insert.slice(0, i) + insert.slice(i + 1), caretOffset: i }
}

/**
 * The `/` slash command menu: filters commands as you type and inserts the
 * chosen snippet at the caret.
 */
export function useSlashMenu(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  {
    value,
    onChangeValue,
    commands = DEFAULT_SLASH_COMMANDS,
    enabled = true,
  }: Options
) {
  const getItems = useCallback(
    (query: string, { atLineStart }: { atLineStart: boolean }) =>
      filterSlashCommands(commands, query, atLineStart),
    [commands]
  )

  const toInsert = useCallback(
    (command: SlashCommand) => applyInsert(command.insert),
    []
  )

  const { menu, activeIndex, select, setActiveIndex, spliceAt } = useTriggerMenu(
    ref,
    {
      value,
      onChangeValue,
      enabled,
      trigger: TRIGGER_RE,
      triggerLength: 1,
      getItems,
      toInsert,
    }
  )

  /**
   * Inserts a command at the current caret, without a typed `/` trigger (used
   * by the mobile floating menu). Block commands are pushed onto a fresh line
   * when the caret sits mid-line, so the markdown stays valid.
   */
  const insertCommand = useCallback(
    (command: SlashCommand) => {
      const textarea = ref.current
      if (!textarea) return
      const start = textarea.selectionStart
      const atLineStart = start === 0 || textarea.value[start - 1] === "\n"
      const prefix =
        (command.scope ?? "block") === "block" && !atLineStart ? "\n" : ""
      const { text, caretOffset } = applyInsert(command.insert)
      spliceAt(start, textarea.selectionEnd, {
        text: prefix + text,
        caretOffset: prefix.length + caretOffset,
      })
    },
    [ref, spliceAt]
  )

  return { menu, activeIndex, select, setActiveIndex, insertCommand }
}
