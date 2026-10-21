import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { BOARD_COLUMNS } from "../../seed"
import type { Column, Dashboard } from "../../types"
import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { newId } from "./new-id"
import { prependBoard } from "./sidebar-layout"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { touchCard } from "../sync/touch"
import { live } from "./live"

/**
 * Creates a board at the top of the sidebar, returns it. With `templateId` it
 * copies that board's columns and cards
 */
export async function createDashboard(
  name: string,
  templateId?: string
): Promise<Dashboard> {
  const id = newId("board")
  const list = await db.getDashboards()
  const last = list.reduce<string | null>(
    (max, d) => (max === null || d.position > max ? d.position : max),
    null
  )
  const position = generateKeyBetween(last, null)
  const dashboard: Dashboard = {
    id,
    title: name,
    position,
    sort: [],
    template: false,
    updatedAt: stamp(),
    deletedAt: null,
  }
  await db.setDashboard(dashboard)
  sync.markDirty("dashboards", id)
  await prependBoard(id)

  const allColumns = await db.getColumns()
  const sourceColumns: Column[] = templateId
    ? allColumns.filter((c) => c.dashboardId === templateId && live(c))
    : BOARD_COLUMNS
  const columnIds = new Map<string, string>()

  await Promise.all(
    sourceColumns.map(async (source) => {
      const column = {
        ...source,
        id: newId("col"),
        dashboardId: id,
        updatedAt: stamp(),
        deletedAt: null,
        stamps: {},
      }
      columnIds.set(source.id, column.id)
      await db.setColumn(column)
      sync.markDirty("columns", column.id)
    })
  )

  if (templateId) {
    const cards = (await db.getCards()).filter(
      (c) => live(c) && columnIds.has(c.columnId)
    )
    await Promise.all(
      cards.map(async (source) => {
        const card = touchCard(
          {
            ...source,
            id: newId("card"),
            columnId: columnIds.get(source.columnId) ?? "",
            number: null,
            users: [],
            attachments: [],
            template: false,
            bodyConflict: null,
            updatedAt: 0,
            stamps: {},
          },
          CARD_GROUPS
        )
        await db.setCard(card)
        sync.markDirty("cards", card.id)
      })
    )
  }
  await recordHistory.board(id, name, "create")
  return dashboard
}
