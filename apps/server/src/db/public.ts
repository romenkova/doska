import { randomBytes } from "node:crypto"
import type { PublicBoard } from "@doska/contract"
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm"
import { user } from "./auth-schema"
import { db } from "./client"
import { boardMembers, cards, columns, dashboards } from "./schema"

/**
 * Public board links: a board is readable by anyone holding its share token,
 * with no account and no session.
 *
 * The token is a separate capability rather than the board id, so re-issuing it
 * kills every old link without touching the board, and the board id never
 * becomes a credential.
 */

/**
 * 128 bits, versus the 48 a board id carries. An id only has to be unique;
 * this one is the entire access check on a board, so it has to be unguessable.
 */
const mintToken = (): string => randomBytes(16).toString("hex")

/**
 * Snapshots already read, by token.
 */
const CACHE_TTL_MS = 10_000
const CACHE_MAX = 200

const snapshots = new Map<string, { board: PublicBoard; expiresAt: number }>()

function cached(token: string, now: number): PublicBoard | null {
  const hit = snapshots.get(token)
  if (!hit) return null
  if (now >= hit.expiresAt) {
    snapshots.delete(token)
    return null
  }
  return hit.board
}

function remember(token: string, board: PublicBoard, now: number): void {
  // Insertion order is age order here (an entry is never updated in place), so
  // the first key is the oldest.
  if (snapshots.size >= CACHE_MAX) {
    const oldest = snapshots.keys().next().value
    if (oldest !== undefined) snapshots.delete(oldest)
  }
  snapshots.set(token, { board, expiresAt: now + CACHE_TTL_MS })
}

/** The board's token, minting one if it has none. Idempotent by design: the
 * publish button can be pressed twice without breaking the link it just gave. */
export async function publishBoard(boardId: string): Promise<string> {
  const existing = await publicToken(boardId)
  if (existing) return existing

  const token = mintToken()
  await db
    .update(dashboards)
    .set({ publicToken: token, publishedAt: Date.now() })
    .where(eq(dashboards.id, boardId))
  return token
}

/** Drops the token, so every link handed out so far 404s on its next load. */
export async function unpublishBoard(boardId: string): Promise<void> {
  const token = await publicToken(boardId)
  await db
    .update(dashboards)
    .set({ publicToken: null, publishedAt: null })
    .where(eq(dashboards.id, boardId))
  if (token) snapshots.delete(token)
}

/**
 * Which of the boards `userId` can see are published
 */
export async function listPublishedBoards(userId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ id: dashboards.id })
    .from(dashboards)
    .leftJoin(
      boardMembers,
      and(
        eq(boardMembers.boardId, dashboards.id),
        eq(boardMembers.userId, userId),
        isNull(boardMembers.revokedAt)
      )
    )
    .where(
      and(
        isNotNull(dashboards.publicToken),
        isNull(dashboards.deletedAt),
        or(eq(dashboards.ownerId, userId), isNotNull(boardMembers.boardId))
      )
    )
  return rows.map((r) => r.id)
}

export async function publicToken(boardId: string): Promise<string | null> {
  const [row] = await db
    .select({ token: dashboards.publicToken })
    .from(dashboards)
    .where(and(eq(dashboards.id, boardId), isNull(dashboards.deletedAt)))
    .limit(1)
  return row?.token ?? null
}

/**
 * The board id a token addresses, or null if it addresses nothing live.
 */
async function boardOfToken(token: string): Promise<string | null> {
  if (!token) return null
  const [row] = await db
    .select({ id: dashboards.id })
    .from(dashboards)
    .leftJoin(user, eq(user.id, dashboards.ownerId))
    .where(
      and(
        eq(dashboards.publicToken, token),
        isNull(dashboards.deletedAt),
        sql`${user.banned} is not true`
      )
    )
    .limit(1)
  return row?.id ?? null
}

/** Fractional-index order, so the page needs no ordering logic of its own. */
const byPosition = <T extends { position: string }>(a: T, b: T): number =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0

/**
 * The whole board behind `token`, or null if the token is unknown, revoked or
 * points at a deleted board. Tombstoned columns and cards are omitted: a public
 * viewer must never see something its owner deleted.
 *
 * The selected columns are the ones the shared record schemas name and nothing
 * else — no `seq`, no `owner_id`, no token. This is a public payload, not a
 * sync frame.
 */
export async function readPublicBoard(
  token: string
): Promise<PublicBoard | null> {
  const now = Date.now()
  const hit = cached(token, now)
  if (hit) return hit

  const boardId = await boardOfToken(token)
  if (!boardId) return null

  const [dashboard] = await db
    .select({
      id: dashboards.id,
      title: dashboards.title,
      position: dashboards.position,
      sort: dashboards.sort,
      updatedAt: dashboards.updatedAt,
      deletedAt: dashboards.deletedAt,
    })
    .from(dashboards)
    .where(eq(dashboards.id, boardId))

  const [boardColumns, boardCards] = await Promise.all([
    db
      .select({
        id: columns.id,
        title: columns.title,
        position: columns.position,
        dashboardId: columns.boardId,
        collapsed: columns.collapsed,
        color: columns.color,
        done: columns.done,
        updatedAt: columns.updatedAt,
        deletedAt: columns.deletedAt,
      })
      .from(columns)
      .where(and(eq(columns.boardId, boardId), isNull(columns.deletedAt))),
    db
      .select({
        id: cards.id,
        title: cards.title,
        body: cards.body,
        position: cards.position,
        columnId: cards.columnId,
        number: cards.number,
        deadline: cards.deadline,
        priority: cards.priority,
        attachments: cards.attachments,
        updatedAt: cards.updatedAt,
        deletedAt: cards.deletedAt,
      })
      .from(cards)
      .where(and(eq(cards.boardId, boardId), isNull(cards.deletedAt))),
  ])

  // A card in a deleted column would otherwise render with no column to sit in.
  const liveColumns = new Set(boardColumns.map((c) => c.id))

  const board: PublicBoard = {
    dashboard,
    columns: boardColumns.sort(byPosition).map((c) => ({ ...c, stamps: {} })),
    cards: boardCards
      .filter((c) => liveColumns.has(c.columnId))
      .sort(byPosition)
      .map((c) => ({ ...c, stamps: {}, bodyConflict: null })),
  }
  remember(token, board, now)
  return board
}

/**
 * Whether `key` is an attachment of a live card on the board behind `token` —
 * the only thing that makes an object readable through the public file route.
 * Without it the route would be an open proxy onto the whole bucket.
 */
export async function publicAttachmentExists(
  token: string,
  key: string
): Promise<boolean> {
  const boardId = await boardOfToken(token)
  if (!boardId) return false

  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(
      and(
        eq(cards.boardId, boardId),
        isNull(cards.deletedAt),
        sql`${cards.attachments} @> ${JSON.stringify([{ key }])}::jsonb`
      )
    )
    .limit(1)
  return Boolean(row)
}
