import { keys } from "../../data/keys"
import { queryClient } from "../../query-client"
import type { HistoryEntry } from "../../types"
import { HISTORY } from "../constants"
import { db } from "../db/db"
import { stampedUser } from "../identity"
import { newId } from "../operations/new-id"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

type Action = HistoryEntry["action"]
type Data = HistoryEntry["data"]

export async function currentUser(): Promise<string | null> {
  return (await stampedUser()) ?? null
}

export async function saveHistory(entry: HistoryEntry): Promise<void> {
  await db.setHistory(entry)
  sync.markDirty(HISTORY, entry.id)
  queryClient.invalidateQueries({ queryKey: keys.activity })
}

async function record(
  input: Pick<HistoryEntry, "boardId" | "entityId" | "entityType" | "action">,
  title: string,
  data: Data
): Promise<void> {
  const now = stamp()
  await saveHistory({
    ...input,
    data: { title, ...data },
    id: newId("hist"),
    userId: await currentUser(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })
}

export const recordHistory = {
  card: (
    boardId: string,
    cardId: string,
    title: string,
    action: Action,
    data: Data = {}
  ) =>
    record(
      { boardId, entityId: cardId, entityType: "card", action },
      title,
      data
    ),
  column: (
    boardId: string,
    columnId: string,
    title: string,
    action: Action,
    data: Data = {}
  ) =>
    record(
      { boardId, entityId: columnId, entityType: "column", action },
      title,
      data
    ),
  board: (boardId: string, title: string, action: Action, data: Data = {}) =>
    record(
      { boardId, entityId: boardId, entityType: "board", action },
      title,
      data
    ),
}
