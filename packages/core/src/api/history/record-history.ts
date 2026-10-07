import { keys } from "../../data/keys"
import { queryClient } from "../../query-client"
import type { HistoryEntry } from "../../types"
import { HISTORY } from "../constants"
import { db } from "../db/db"
import { stampedUser } from "../identity"
import { newId } from "../operations/new-id"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

export type HistoryInput = Pick<
  HistoryEntry,
  "boardId" | "entityId" | "entityType" | "action" | "data"
>

export async function currentUser(): Promise<string | null> {
  return (await stampedUser()) ?? null
}

export async function saveHistory(entry: HistoryEntry): Promise<void> {
  await db.setHistory(entry)
  sync.markDirty(HISTORY, entry.id)
  queryClient.invalidateQueries({ queryKey: keys.activity })
}

export async function recordHistory(input: HistoryInput): Promise<void> {
  const now = stamp()
  await saveHistory({
    ...input,
    id: newId("hist"),
    userId: await currentUser(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })
}
