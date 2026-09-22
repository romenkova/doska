import { PREFIXED_NAME } from "./prefix"

/**
 * A `#tag` written in a card body
 */
export const TAG_RE = new RegExp(`(^|\\s)#(${PREFIXED_NAME})`, "gu")

const FENCED_CODE_RE =
  /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))/gm
const INLINE_CODE_RE = /(`+)[\s\S]*?[^`]\1(?!`)/g

export function tagsIn(body: string): string[] {
  const text = body.replace(FENCED_CODE_RE, " ").replace(INLINE_CODE_RE, " ")
  const names = new Set<string>()
  for (const match of text.matchAll(TAG_RE)) names.add(match[2])
  return [...names]
}
