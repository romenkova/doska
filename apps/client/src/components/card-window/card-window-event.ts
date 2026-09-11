// Sent by a popout to the main window
export const REVEAL_EVENT = "card-window:reveal"

export interface RevealPayload {
  cardId: string
  deckId: string
}
