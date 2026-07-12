import type { Session } from "../api/auth"
import { keys } from "../data/keys"
import { queryClient } from "../query-client"

export function isAuthed(): boolean {
  return queryClient.getQueryData<Session>(keys.session)?.authed === true
}

export function subscribeAuthed(listener: () => void): () => void {
  let authed = isAuthed()
  return queryClient.getQueryCache().subscribe(() => {
    const next = isAuthed()
    if (next === authed) return
    authed = next
    if (authed) listener()
  })
}
