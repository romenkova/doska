import { emitTo } from "@tauri-apps/api/event"

// Sent by a popout to the main window
export const REVEAL_EVENT = "card-window:reveal"

export interface RevealPayload {
  cardId: string
  deckId: string
}

export function revealInMain(payload: RevealPayload) {
  void emitTo("main", REVEAL_EVENT, payload)
}
