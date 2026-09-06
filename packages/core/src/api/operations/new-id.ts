import { v4 as uuid } from "uuid"

/**
 * A record id: the kind, then 12 hex chars of a v4 uuid. That is 48 bits — one
 * collision in 5.6 million at ten thousand records — which the ids being
 * opaque and never read aloud makes plenty. The card number is the id people say.
 */
export function newId(kind: "board" | "col" | "card" | "folder"): string {
  // The dashes first: a bare slice would eat the one at position 8 and leave
  // 11 hex digits, not 12.
  return `${kind}-${uuid().replaceAll("-", "").slice(0, 12)}`
}
