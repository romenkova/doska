import type { Card } from "@doska/core/types"
import { cut, soleImage, type SoleImage } from "@doska/markdown"

/** The one image a card consists of, if that's all it holds. Mirrors web's `cardSoleImage`. */
export function cardSoleImage(card: Card): SoleImage | null {
  const { body: preview, applied: hasMore } = cut.cardRender(card.body)
  const files = card.attachments ?? []

  if (preview.trim()) {
    if (hasMore) return null
    const image = soleImage(preview)
    if (!image) return null
    const shown = image.source.kind === "attachment" ? image.source.key : null
    return files.every((a) => a.key === shown) ? image : null
  }

  const [only] = files
  if (files.length !== 1 || !only.mime.startsWith("image/")) return null
  return { source: { kind: "attachment", key: only.key }, alt: only.name }
}
