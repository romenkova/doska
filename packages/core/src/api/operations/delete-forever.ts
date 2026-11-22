import { RETENTION_MS } from "@doska/contract"
import type { Card, Column } from "../../types"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { touchCard, touchColumn } from "../sync/touch"
import { live } from "./live"
import type { TrashKind } from "./restore"

export async function deleteForever(
  kind: TrashKind,
  id: string
): Promise<void> {
  const expired = Date.now() - 2 * RETENTION_MS

  switch (kind) {
    case DASHBOARDS: {
      const dashboard = await db.getDashboard(id)
      if (!dashboard || live(dashboard)) return
      // Top down, as in restore
      await db.setDashboard({
        ...dashboard,
        deletedAt: expired,
        updatedAt: stamp(),
      })
      sync.markDirty(DASHBOARDS, id)
      for (const column of await db.getColumns()) {
        if (column.dashboardId === id) await expireColumn(column, expired)
      }
      return
    }
    case COLUMNS: {
      const column = await db.getColumn(id)
      if (column) await expireColumn(column, expired)
      return
    }
    case CARDS: {
      const card = await db.getCard(id)
      if (card) await expireCard(card, expired)
      return
    }
  }
}

async function expireColumn(column: Column, expired: number): Promise<void> {
  if (live(column)) return
  await db.setColumn(
    touchColumn({ ...column, deletedAt: expired }, ["deleted"])
  )
  sync.markDirty(COLUMNS, column.id)
  for (const card of await db.getCards(column.id)) {
    await expireCard(card, expired)
  }
}

async function expireCard(card: Card, expired: number): Promise<void> {
  if (live(card)) return
  await db.setCard(touchCard({ ...card, deletedAt: expired }, ["deleted"]))
  sync.markDirty(CARDS, card.id)
}
