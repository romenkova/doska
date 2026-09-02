import { ORPCError } from "@orpc/server"
import { and, count, eq, isNull, ne } from "drizzle-orm"
import { db } from "./client"
import { account, dashboards, user } from "./schema"

export interface AccountRow {
  id: string
  isAdmin: boolean
  active: boolean
}

export async function findAccount(
  userId: string
): Promise<AccountRow | undefined> {
  const [row] = await db
    .select({ id: user.id, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!row) return undefined
  return { id: row.id, isAdmin: row.role === "admin", active: !row.banned }
}

/** Administering accounts is the seeded owner's alone. */
export async function assertAdmin(userId: string): Promise<void> {
  const caller = await findAccount(userId)
  if (!caller?.isAdmin) throw new ORPCError("FORBIDDEN")
}

/**
 * Live boards only. A tombstoned board is the purge job's to collect, and its
 * `owner_id` is read by nobody once the account behind it is gone.
 */
export async function countOwnedBoards(userId: string): Promise<number> {
  const [row] = await db
    .select({ boards: count() })
    .from(dashboards)
    .where(and(eq(dashboards.ownerId, userId), isNull(dashboards.deletedAt)))

  return row?.boards ?? 0
}

export async function listSsoUserIds(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ userId: account.userId })
    .from(account)
    .where(ne(account.providerId, "credential"))
  return rows.map((row) => row.userId)
}

/** Sessions and credentials go with the row — both cascade on delete. */
export async function deleteAccount(userId: string): Promise<void> {
  await db.delete(user).where(eq(user.id, userId))
}
