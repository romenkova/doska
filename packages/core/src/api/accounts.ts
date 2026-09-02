/**
 * Account administration, straight over better-auth's `admin` plugin. There are
 * no oRPC procedures behind this: the plugin's own routes already enforce the
 * admin check server-side, so the UI is the only thing missing.
 *
 */

import { authClient } from "./auth-client"
import { orpc } from "./sync/orpc"

export type Account = {
  id: string
  login: string
  isAdmin: boolean
  active: boolean
  /** Signs in through an identity provider, maybe besides a password. */
  sso: boolean
}

/**
 * better-auth types the admin routes against its own user model, which has no
 * `username` — that column belongs to the `username` plugin and rides along on
 * the row without being in the type.
 */
type AdminUser = {
  id: string
  name: string
  username?: string | null
  role?: string | null
  banned?: boolean | null
}

type ClientError = { code?: string; message?: string }

/** Collisions surface as whichever unique column the server hit first. Both mean
 * the same thing to someone who only typed a login. */
const TAKEN = [
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  "USERNAME_IS_ALREADY_TAKEN",
]

function fail(error: ClientError, fallback: string): never {
  if (error.code && TAKEN.includes(error.code))
    throw new Error("That login is already taken.")
  throw new Error(error.message || fallback)
}

export async function listAccounts(): Promise<Account[]> {
  const [{ data, error }, { userIds }] = await Promise.all([
    authClient().admin.listUsers({
      query: { limit: 200, sortBy: "createdAt", sortDirection: "asc" },
    }),
    orpc.accounts.sso(),
  ])
  if (error) fail(error, "Could not load accounts")

  const sso = new Set(userIds)
  return (data.users as AdminUser[]).map((user) => ({
    id: user.id,
    login: user.username ?? user.name,
    isAdmin: user.role === "admin",
    active: !user.banned,
    sso: sso.has(user.id),
  }))
}

export async function createAccount(
  login: string,
  password: string
): Promise<void> {
  const { error } = await authClient().admin.createUser({
    name: login,
    // Same synthetic address the first account is seeded with (see the server's
    // `seed.ts`): better-auth keys users by email, but a login isn't one.
    email: `${encodeURIComponent(login)}@deck.invalid`,
    password,
    // `createUser` takes only better-auth's core fields inline; the username
    // plugin's columns ride along in `data`.
    data: { username: login, displayUsername: login },
  })
  if (error) fail(error, "Could not create the account")
}

export async function setAccountPassword(
  id: string,
  password: string
): Promise<void> {
  const { error } = await authClient().admin.setUserPassword({
    userId: id,
    newPassword: password,
  })
  if (error) fail(error, "Could not set the password")
}

/** Live boards the account still owns; deleting it is refused while any remain. */
export async function countOwnedBoards(id: string): Promise<number> {
  const { boards } = await orpc.accounts.ownedBoards({ userId: id })
  return boards
}

export function deleteAccount(id: string): Promise<void> {
  return orpc.accounts.remove({ userId: id })
}

export async function setAccountActive(
  id: string,
  active: boolean
): Promise<void> {
  const { error } = active
    ? await authClient().admin.unbanUser({ userId: id })
    : await authClient().admin.banUser({ userId: id })
  if (error) fail(error, "Could not change the account")
}
