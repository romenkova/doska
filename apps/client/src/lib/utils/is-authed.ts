import type { Session } from "../api/auth"
import { keys } from "../data/keys"
import { queryClient } from "../query-client"

export function isAuthed(): boolean {
  return queryClient.getQueryData<Session>(keys.session)?.authed === true
}
