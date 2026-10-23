import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { touchCard } from "../sync/touch"

export async function setCardTemplate(
  id: string,
  template: boolean
): Promise<void> {
  const card = await db.getCard(id)
  if (!card) return
  await db.setCard(touchCard({ ...card, template }, ["template"]))
  sync.markDirty("cards", id)
}

export async function setDashboardTemplate(
  id: string,
  template: boolean
): Promise<void> {
  const dashboard = await db.getDashboard(id)
  if (!dashboard) return
  await db.setDashboard({ ...dashboard, template, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
}
