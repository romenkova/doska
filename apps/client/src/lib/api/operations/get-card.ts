import { fallbackCard } from "@/lib/seed"
import type { Card } from "@/lib/types"
import { db } from "../db/db"

/** A single card (title + markdown body). */
export async function getCard(id: string): Promise<Card> {
  return (await db.getCard(id)) ?? fallbackCard
}
