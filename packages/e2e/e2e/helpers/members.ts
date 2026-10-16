import type { APIRequestContext } from "@playwright/test"
import { rpc } from "./rpc"

/* -------------------------------------------------------------------------- */
/*  Sharing from a second client — the board's owner, working somewhere else,  */
/*  while the page under test is signed in as the member.                      */
/* -------------------------------------------------------------------------- */

/** The account named `username`, from the active users the picker reads. */
async function accountId(
  request: APIRequestContext,
  username: string
): Promise<string> {
  const { users } = await rpc<{ users: { id: string; username: string }[] }>(
    request,
    "users/list"
  )
  const account = users.find((u) => u.username === username)
  if (!account) throw new Error(`no account named ${username} on the server`)
  return account.id
}

/** The owner takes `username` off `boardId` — the revocation the member's page
 * has to notice on its own, with nothing happening in its own tab. */
export async function remoteUnshare(
  request: APIRequestContext,
  boardId: string,
  username: string
): Promise<void> {
  await rpc(request, "members/remove", {
    boardId,
    userId: await accountId(request, username),
  })
}
