import { fallbackCard } from "@/lib/seed"
import type { Card } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Updates a card's title/body/deadline/attachments, preserving column and position. */
export async function updateCard(
  id: string,
  patch: Partial<Pick<Card, "title" | "body" | "deadline" | "attachments">>
): Promise<void> {
  const existing = (await db.getCard(id)) ?? { ...fallbackCard, id }
  await db.setCard({ ...existing, ...patch, id, updatedAt: stamp() })
  sync.markDirty("cards", id)
}
