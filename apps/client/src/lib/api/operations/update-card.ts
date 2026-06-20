import { fallbackCard } from "@/lib/seed"
import type { Card } from "@/lib/types"
import { db } from "../db"
import { markDirty } from "../sync"

/** Updates a card's title/body, preserving its column and position. */
export async function updateCard(
  id: string,
  patch: Pick<Card, "title" | "body">
): Promise<void> {
  const existing = (await db.getCard(id)) ?? { ...fallbackCard, id }
  await db.setCard({ ...existing, ...patch, id, updatedAt: Date.now() })
  markDirty("cards", id)
}
