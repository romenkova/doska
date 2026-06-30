import { fallbackCard } from "@/lib/seed"
import type { Card } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

/** Updates a card's title/body/deadline, preserving its column and position. */
export async function updateCard(
  id: string,
  patch: Partial<Pick<Card, "title" | "body" | "deadline">>
): Promise<void> {
  const existing = (await db.getCard(id)) ?? { ...fallbackCard, id }
  await db.setCard({ ...existing, ...patch, id, updatedAt: Date.now() })
  sync.markDirty("cards", id)
}
