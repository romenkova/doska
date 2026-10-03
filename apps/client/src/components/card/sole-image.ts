import type { SoleImage } from "@doska/markdown"
import type { Attachment } from "@doska/core"
import { isRenderableImage } from "./attachments/renderable-image"

export function cardSoleImage(
  hasBody: boolean,
  bodyImage: SoleImage | null,
  attachments: Attachment[]
): SoleImage | null {
  if (hasBody) {
    if (!bodyImage) return null
    const shown =
      bodyImage.source.kind === "attachment" ? bodyImage.source.key : null
    return attachments.every((a) => a.key === shown) ? bodyImage : null
  }

  const [only] = attachments
  if (attachments.length !== 1 || !isRenderableImage(only.mime)) return null
  return { source: { kind: "attachment", key: only.key }, alt: only.name }
}
