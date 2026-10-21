import type { Card } from "../../types"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"

export interface TemplateCard {
  card: Card
  boardId: string
  boardTitle: string
}

/** Cards marked as templates, on any live board this device has. */
export async function getTemplateCards(): Promise<TemplateCard[]> {
  const [cards, columns, dashboards] = await Promise.all([
    db.getCards(),
    db.getColumns(),
    db.getDashboards(),
  ])
  const columnById = new Map(columns.filter(live).map((c) => [c.id, c]))
  const boardById = new Map(dashboards.filter(live).map((d) => [d.id, d]))

  return cards
    .filter((card) => card.template && live(card))
    .sort(byPosition)
    .flatMap((card) => {
      const column = columnById.get(card.columnId)
      const board = column && boardById.get(column.dashboardId)
      if (!board) return []
      return [{ card, boardId: board.id, boardTitle: board.title }]
    })
}
