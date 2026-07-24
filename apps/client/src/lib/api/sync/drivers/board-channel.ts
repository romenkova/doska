import type { Change } from "@doska/contract"
import type { DirtyStore } from "@doska/sync"
import type { Card, Column, Dashboard } from "@/lib/types"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { idb } from "../../db/idb"
import { clock, persistClock } from "../hlc"

/** Board-channel steps (a board's columns + cards), shared server ⇄ filesystem. */

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
    const record = await idb.get<Column>(COLUMNS, id)
    if (!record) return null
    boardId = record.dashboardId
    change = { store, record }
  } else if (store === CARDS) {
    const record = await idb.get<Card>(CARDS, id)
    if (!record) return null
    const column = await idb.get<Column>(COLUMNS, record.columnId)
    if (!column) return null
    boardId = column.dashboardId
    change = { store, record }
  } else {
    return null
  }

  const board = await idb.get<Dashboard>(DASHBOARDS, boardId)
  return { boardId, change, live: !!board && board.deletedAt == null }
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

  for (const ref of dirty.all()) {
    const entity = await boardEntity(ref)
    if (!entity || !entity.live) {
      dead.push(ref)
      continue
    }
    if (entity.boardId === boardId) {
      changes.push(entity.change)
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

/** LWW-upserts pulled changes and invalidates the touched board/cards. */
export async function applyBoardRemote(
  boardId: string,
  changes: Change[]
): Promise<void> {
  const touchedCards: string[] = []
  let touchedBoard = false

  for (const { store, record } of changes) {
    clock.receive(record.updatedAt)
    const existing = await idb.get<{ updatedAt: number }>(store, record.id)
    if (existing && existing.updatedAt >= record.updatedAt) continue
    await idb.set(store, record.id, record)

    if (store === CARDS) {
      touchedCards.push(record.id)
      touchedBoard = true
    } else if (store === COLUMNS) {
      touchedBoard = true
    }
  }
  void persistClock()

  if (touchedBoard)
    queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
  for (const id of touchedCards)
    queryClient.invalidateQueries({ queryKey: keys.card(id) })
}
