import { runtime } from "../runtime"
import { clearLastBoard } from "../data/last-board"
import { DASHBOARDS, META_STORE, STORES } from "./constants"
import { live } from "./operations/live"
import { getServerUrl } from "./server"
import { sync } from "./sync"
import { SYNCED_BODY_RANGE } from "./sync/synced-body"
import type { Dashboard } from "../types"

/** Whose data the local store currently holds, per sync server */
const USER_KEY = "deck:user-id"

/** Same server typed two ways is one scope, so drop what doesn't identify it. */
function serverScope(): string {
  return getServerUrl()
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
}

function userKey(): string {
  const server = serverScope()
  return server ? `${USER_KEY}:${server}` : USER_KEY
}

function stampedUser(): Promise<string | undefined> {
  return runtime().db.get<string>(META_STORE, userKey())
}

/**
 * Moves the unscoped id an older build left behind onto the server it was
 * stamped against.
 */
export async function migrateUserKey(): Promise<void> {
  const key = userKey()
  if (key === USER_KEY) return

  const legacy = await runtime().db.get<string>(META_STORE, USER_KEY)
  if (legacy === undefined) return
  await runtime().db.delete(META_STORE, USER_KEY)

  const scoped = await runtime().db.get<string>(META_STORE, key)
  if (scoped === undefined) await runtime().db.set(META_STORE, key, legacy)
}

/** Every pull cursor is `cursor:<scope>` — see the drivers. `;` is `:` plus one,
 * so an exclusive upper bound there is the prefix range. */
const CURSOR_RANGE = {
  lower: "cursor:",
  upper: "cursor;",
  exclusive: { upper: true },
}

/**
 * Points the local store at `userId`, wiping it first if it belongs to someone else
 */
export async function reconcileIdentity(
  userId: string | null
): Promise<boolean> {
  // Signing out leaves the data alone: it is still the same person's.
  if (userId === null) return false

  const previous = await stampedUser()
  if (previous === userId) return false

  if (previous !== undefined) await wipe()
  await runtime().db.set(META_STORE, userKey(), userId)
  return previous !== undefined
}

/**
 * Everything derived from the previous account
 */
async function wipe(): Promise<void> {
  for (const store of STORES) await runtime().db.clear(store)

  const cursors = await runtime().db.keys(META_STORE, CURSOR_RANGE)
  for (const key of cursors) await runtime().db.delete(META_STORE, key)
  const syncedBodies = await runtime().db.keys(META_STORE, SYNCED_BODY_RANGE)
  for (const key of syncedBodies) await runtime().db.delete(META_STORE, key)

  clearLastBoard()

  // Last, so the pull it kicks off finds the cursors already gone.
  sync.reset()
}

export const UNCLAIMED_BOARDS_WARNING =
  "The boards already on this device will become part of the account you sign in with."

/**
 * Whether this device holds board work that no account has claimed yet
 */
export async function hasUnclaimedLocalBoards(): Promise<boolean> {
  const known = await stampedUser()
  if (known !== undefined) return false

  const boards = await runtime().db.getAll<Dashboard>(DASHBOARDS)
  return boards.some((board) => live(board) && board.updatedAt > 0)
}
