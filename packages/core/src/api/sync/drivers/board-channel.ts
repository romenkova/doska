import {
  CARD_FIELD_GROUP,
  COLUMN_FIELD_GROUP,
  type Change,
} from "@doska/contract"
import { mergeRecord } from "@doska/merge"
import type { DirtyStore } from "@doska/sync"
import type { Card, Column, Dashboard } from "../../../types"
import { keys } from "../../../data/keys"
import { queryClient } from "../../../query-client"
import { runtime } from "../../../runtime"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { db } from "../../db/db"
import { clock, persistClock } from "../hlc"
import { getSyncedBody, setSyncedBody } from "../synced-body"

/** Board-channel steps (a board's columns + cards), shared server ⇄ filesystem. */

/**
 * Card bodies in the push under way.
 */
const pushedBodies = new Map<string, string>()

/**
 * The board a dirty ref belongs to, its live record, and whether that board is
 * live. null when the ref isn't a board entity or its record/column is gone.
 * `live` folds in the board tombstone check so callers need no extra read.
 */
async function boardEntity(
  ref: string
): Promise<{ boardId: string; change: Change; live: boolean } | null> {
  const [store, id] = ref.split("/")

  let boardId: string
  let change: Change
  if (store === COLUMNS) {
    const record = await runtime().db.get<Column>(COLUMNS, id)
    if (!record) return null
    boardId = record.dashboardId
    change = { store, record }
  } else if (store === CARDS) {
    const record = await runtime().db.get<Card>(CARDS, id)
    if (!record) return null
    const column = await runtime().db.get<Column>(COLUMNS, record.columnId)
    if (!column) return null
    boardId = column.dashboardId
    change = { store, record }
  } else {
    return null
  }

  const board = await runtime().db.get<Dashboard>(DASHBOARDS, boardId)
  return { boardId, change, live: !!board && board.deletedAt == null }
}

/**
 * A card change as pushed
 */
async function forPush(change: Change): Promise<Change> {
  if (change.store !== CARDS) return change
  const { record } = change
  pushedBodies.set(record.id, record.body)
  const syncedBody = await getSyncedBody(record.id)
  if (syncedBody === undefined || syncedBody === record.body) return change
  return { ...change, baseBody: syncedBody }
}

/**
 * Dirty refs belonging to `boardId` as changes to push, plus the refs consumed
 * (restored on push failure). Other live boards stay dirty; dead refs are dropped.
 */
export async function collectBoardChanges(
  boardId: string,
  dirty: DirtyStore
): Promise<{ changes: Change[]; refs: string[] }> {
  const changes: Change[] = []
  const refs: string[] = []
  const dead: string[] = []

  // Whatever a failed push left here never reached the server.
  pushedBodies.clear()

  for (const ref of dirty.all()) {
    const entity = await boardEntity(ref)
    if (!entity || !entity.live) {
      dead.push(ref)
      continue
    }
    if (entity.boardId === boardId) {
      changes.push(await forPush(entity.change))
      refs.push(ref)
    }
  }

  if (dead.length) dirty.drop(dead)

  return { changes, refs }
}

/** Every live board with dirty refs, so the engine flushes them all. */
export async function pendingBoardIds(dirty: DirtyStore): Promise<string[]> {
  const boardIds = new Set<string>()
  for (const ref of dirty.all()) {
    const entity = await boardEntity(ref)
    if (entity?.live) boardIds.add(entity.boardId)
  }
  return [...boardIds]
}

/**
 * Merges a pulled card group by group
 */
async function applyCard(remote: Card): Promise<boolean> {
  const local = await db.getCard(remote.id)
  const syncedBody = await getSyncedBody(remote.id)
  const unpushedEdit =
    local !== undefined && syncedBody !== undefined && local.body !== syncedBody

  let incoming = remote
  if (unpushedEdit) {
    const bodyStamp = local.stamps.body ?? local.updatedAt
    const stamps = { ...remote.stamps, body: bodyStamp }
    incoming = { ...remote, body: local.body, stamps }
  } else if (syncedBody !== remote.body) {
    await setSyncedBody(remote.id, remote.body)
  }

  let { record, changed } = mergeRecord(local, incoming, CARD_FIELD_GROUP)
  if (remote.number !== null && record.number !== remote.number) {
    record = { ...record, number: remote.number }
    changed = true
  }
  if (!changed) return false

  await db.setCard(record)
  return true
}

async function applyColumn(remote: Column): Promise<boolean> {
  const local = await db.getColumn(remote.id)
  const { record, changed } = mergeRecord(local, remote, COLUMN_FIELD_GROUP)
  if (!changed) return false

  await db.setColumn(record)
  return true
}

/** Whole-record LWW, for the stores that carry no group stamps. */
async function applyRecord(change: Change): Promise<boolean> {
  const { store, record } = change
  const existing = await runtime().db.get<{ updatedAt: number }>(
    store,
    record.id
  )
  if (existing && existing.updatedAt >= record.updatedAt) return false

  await runtime().db.set(store, record.id, record)
  return true
}

/** Merges pulled changes and invalidates the touched board/cards. */
export async function applyBoardRemote(
  boardId: string,
  changes: Change[]
): Promise<void> {
  for (const [id, body] of pushedBodies) await setSyncedBody(id, body)
  pushedBodies.clear()

  const touchedCards: string[] = []
  let touchedBoard = false

  for (const change of changes) {
    clock.receive(change.record.updatedAt)

    if (change.store === CARDS) {
      if (!(await applyCard(change.record))) continue
      touchedCards.push(change.record.id)
      touchedBoard = true
    } else if (change.store === COLUMNS) {
      if (!(await applyColumn(change.record))) continue
      touchedBoard = true
    } else {
      await applyRecord(change)
    }
  }
  void persistClock()

  if (touchedBoard) {
    queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
    // The digest reads its own query, so the board's invalidation misses it.
    queryClient.invalidateQueries({ queryKey: keys.digest })
  }
  for (const id of touchedCards)
    queryClient.invalidateQueries({ queryKey: keys.card(id) })
}
