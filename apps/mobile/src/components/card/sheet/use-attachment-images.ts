import { activeStorage } from "@doska/core/attachments"
import type { Attachment } from "@doska/core/types"
import { useEffect, useState } from "react"

const cache = new Map<string, string>()

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Image attachments as data URLs, keyed by attachment key
 */
export function useAttachmentImages(
  cardId: string,
  attachments: Attachment[]
): Record<string, string> {
  const keys = attachments
    .filter((a) => a.mime.startsWith("image/"))
    .map((a) => a.key)
  const signature = keys.join("\0")
  const [images, setImages] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    const pending = keys.filter((key) => !cache.has(key))
    Promise.all(
      pending.map((key) =>
        activeStorage()
          .get(cardId, key)
          .then(toDataUrl)
          .then((url) => cache.set(key, url))
          .catch(() => undefined)
      )
    ).then(() => {
      if (!alive) return
      const resolved: Record<string, string> = {}
      for (const key of keys) {
        const url = cache.get(key)
        if (url) resolved[key] = url
      }
      setImages(resolved)
    })
    return () => {
      alive = false
    }
    // `signature` stands in for `keys`, which is a fresh array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, signature])

  return images
}
