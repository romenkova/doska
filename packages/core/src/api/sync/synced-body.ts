import { runtime } from "../../runtime"
import { META_STORE } from "../constants"

/**
 * The body a card last had in sync with the server, the base the server merges
 * a local edit against. Kept out of the card record so no `{ ...card }` copy
 * (board cache, undo, vault, MCP) has to strip it.
 */
const key = (cardId: string) => `synced-body:${cardId}`

/** The key range of every entry, for a wipe. */
export const SYNCED_BODY_RANGE = {
  lower: "synced-body:",
  upper: "synced-body;",
  exclusive: { upper: true },
}

export function getSyncedBody(cardId: string): Promise<string | undefined> {
  return runtime().db.get<string>(META_STORE, key(cardId))
}

export function setSyncedBody(cardId: string, body: string): Promise<void> {
  return runtime().db.set(META_STORE, key(cardId), body)
}

export function deleteSyncedBody(cardId: string): Promise<void> {
  return runtime().db.delete(META_STORE, key(cardId))
}
