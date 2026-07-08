import type { FileStorage } from "@doska/file-storage"
import type { Attachment } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

export interface MigrateProgress {
  done: number
  total: number
}

/**
 * Copies every card's attachment bytes from one backend to another and rewrites
 * the stored keys, then re-pushes the touched cards. Non-destructive: the source
 * blobs are left in place. Runs after the records themselves have been exported
 * to the new backend, so a card's on-disk location (for the FS backend) exists.
 */
export async function migrateAttachments(
  from: FileStorage,
  to: FileStorage,
  onProgress?: (p: MigrateProgress) => void
): Promise<void> {
  const cards = (await db.getCards()).filter(
    (c) => c.deletedAt == null && c.attachments?.length
  )
  const total = cards.reduce((n, c) => n + c.attachments.length, 0)
  let done = 0
  onProgress?.({ done, total })

  for (const card of cards) {
    const next: Attachment[] = []
    for (const att of card.attachments) {
      const bytes = await from.get(card.id, att.key)
      const stored = await to.put(card.id, {
        name: att.name,
        mime: att.mime,
        bytes,
      })
      next.push({ ...att, key: stored.key, mime: stored.mime, size: stored.size })
      done++
      onProgress?.({ done, total })
    }
    await db.setCard({ ...card, attachments: next, updatedAt: Date.now() })
    sync.markDirty("cards", card.id)
  }
  await sync.reconcile()
}

/** Whether any live card carries attachments — gates the migration checkbox. */
export async function hasAttachments(): Promise<boolean> {
  const cards = await db.getCards()
  return cards.some((c) => c.deletedAt == null && c.attachments?.length > 0)
}
