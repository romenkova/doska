import type { Member, MemberRole } from "@doska/contract"
import { and, eq, isNull, or, sql } from "drizzle-orm"
import { db } from "../client"
import { boardMembers, dashboards, user } from "../schema"
import { applyChanges } from "./core/apply-changes"
import { boardsListCounter } from "./constants"

/** Accounts predate usernames, so fall back to the name they signed up with. */
const displayName = sql<string>`coalesce(${user.username}, ${user.name})`

/**
 * Everyone with access to `boardId`: the owner first, then its live members.
 * The owner has no membership row — they are read off the board itself, and a
 * board with no owner yet (never pushed to this server) has no roster at all.
 */
export async function listRoster(boardId: string): Promise<Member[]> {
  const [owner] = await db
    .select({ userId: user.id, username: displayName, image: user.image })
    .from(dashboards)
    .innerJoin(user, eq(user.id, dashboards.ownerId))
    .where(eq(dashboards.id, boardId))

  const members = await db
    .select({
      userId: boardMembers.userId,
      role: boardMembers.role,
      username: displayName,
      image: user.image,
    })
    .from(boardMembers)
    .innerJoin(user, eq(user.id, boardMembers.userId))
    .where(
      and(eq(boardMembers.boardId, boardId), isNull(boardMembers.revokedAt))
    )

  return owner ? [{ ...owner, role: "owner" }, ...members] : members
}

/** Board ids `userId` shares with someone: owned and given away, or given to
 * them. What the sidebar marks; it says nothing about who the others are. */
export async function listSharedBoards(userId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ boardId: boardMembers.boardId })
    .from(boardMembers)
    .innerJoin(dashboards, eq(dashboards.id, boardMembers.boardId))
    .where(
      and(
        isNull(boardMembers.revokedAt),
        or(eq(boardMembers.userId, userId), eq(dashboards.ownerId, userId))
      )
    )
  return rows.map((r) => r.boardId)
}

/**
 * Every board `userId` is still a member of.
 */
export async function revokeAllMemberships(
  userId: string,
  now = Date.now()
): Promise<void> {
  const rows = await db
    .select({ boardId: boardMembers.boardId })
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, userId), isNull(boardMembers.revokedAt)))

  if (rows.length === 0) return
  await writeMembers(
    rows.map(({ boardId }) => ({ boardId, userId, revokedAt: now })),
    now
  )
}

/** A grant, a role change or a revocation — all of them rewrite the one row. */
export interface MemberWrite {
  boardId: string
  userId: string
  role?: MemberRole
  /** Epoch ms to revoke, `null` to grant or restore. */
  revokedAt?: number | null
}

/**
 * Writes membership rows, stamping each with the next board-list `seq` so the
 * member's client picks the change up past a cursor that has already passed the
 * board itself.
 *
 * Server-authoritative, so no last-writer-wins: every write lands and takes a
 * `seq`. Counter and rows move in one transaction, as in {@link applyChanges}'s
 * other callers, so they cannot drift.
 */
export function writeMembers(
  writes: MemberWrite[],
  now = Date.now()
): Promise<void> {
  return applyChanges(
    boardsListCounter(),
    writes,
    async (tx, { boardId, userId, role = "editor", revokedAt = null }, seq) => {
      await tx
        .insert(boardMembers)
        .values({ boardId, userId, role, seq, revokedAt, updatedAt: now })
        .onConflictDoUpdate({
          target: [boardMembers.boardId, boardMembers.userId],
          set: { role, seq, revokedAt, updatedAt: now },
        })
      return true
    }
  )
}
