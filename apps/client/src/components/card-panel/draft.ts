import { mergeBody } from "@doska/merge"
import type { Card } from "@doska/core/types"

/** Backs the textareas only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

/** A draft with the body it was typed over, to tell a pull from its own save landing. */
export interface DraftState extends Draft {
  base: string
}

/**
 * The draft after the card's body changed under it: its own save landing, or
 * a pull. Typing over the old body is carried onto the new one. The same
 * object comes back when nothing changed.
 */
export function rebaseDraft(draft: DraftState, body: string): DraftState {
  if (draft.base === body) return draft
  if (draft.body === undefined) return { ...draft, base: body }
  // Ours wins where both touched a line: the user is typing there right now.
  const merged = mergeBody(draft.base, draft.body, body).body
  return { ...draft, base: body, body: merged }
}
