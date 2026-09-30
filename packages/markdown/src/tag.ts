import { PREFIXED_NAME } from "./prefix"

/**
 * A `#tag` written in a card body
 */
export const TAG_RE = new RegExp(`(^|\\s)#(${PREFIXED_NAME})`, "gu")

const TAG_NAME_RE = new RegExp(`^${PREFIXED_NAME}$`, "u")

/** A typed tag without its `#`. */
export function toTagName(input: string): string | null {
  const name = input.trim().replace(/^#/, "")
  return TAG_NAME_RE.test(name) ? name : null
}
