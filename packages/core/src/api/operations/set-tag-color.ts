import { tagKey } from "../../utils/tag-color"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

async function writeTagColors(
  deckId: string,
  change: (colors: Record<string, string>) => void
): Promise<void> {
  const dashboard = await db.getDashboard(deckId)
  if (!dashboard) return
  // Boards stored before tag colors existed have no map
  const colors = { ...(dashboard.tagColors ?? {}) }
  change(colors)
  await db.setDashboard({ ...dashboard, tagColors: colors, updatedAt: stamp() })
  sync.markDirty("dashboards", deckId)
}

/** An empty `color` clears it. */
export function setTagColor(
  deckId: string,
  tag: string,
  color: string
): Promise<void> {
  return writeTagColors(deckId, (colors) => {
    if (color) colors[tagKey(tag)] = color
    else delete colors[tagKey(tag)]
  })
}

/** On a merge the target keeps its own color. */
export async function moveTagColor(
  deckId: string,
  from: string,
  to: string
): Promise<void> {
  const dashboard = await db.getDashboard(deckId)
  const color = dashboard?.tagColors?.[tagKey(from)]
  if (!color) return
  await writeTagColors(deckId, (colors) => {
    delete colors[tagKey(from)]
    if (!colors[tagKey(to)]) colors[tagKey(to)] = color
  })
}
