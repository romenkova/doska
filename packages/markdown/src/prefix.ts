import { isLineStart } from "./slash-commands"

/** What may follow a `#` or `@`: a letter, then letters, digits, `_` or `-`. */
export const PREFIXED_NAME = "\\p{L}[\\p{L}\\p{N}_-]*"

export interface PrefixOption {
  name: string
  hint?: string
}

export interface PrefixTrigger {
  /** Index of the prefix. */
  start: number
  /** The partial name typed after it, possibly empty. */
  query: string
}

export function matchPrefixTrigger(
  value: string,
  caret: number,
  prefix: string
): PrefixTrigger | null {
  const trigger = new RegExp(`(?:^|\\s)${prefix}((?:${PREFIXED_NAME})?)$`, "u")
  const match = trigger.exec(value.slice(0, caret))
  if (!match) return null
  const query = match[1]
  const start = caret - query.length - prefix.length

  // A bare `#` opening a line can be heading
  if (prefix === "#" && query === "" && isLineStart(value, start)) return null
  return { start, query }
}
