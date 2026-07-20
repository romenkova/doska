import { useEffect, useState } from "react"
import type { Attachment } from "@/lib/types"
import { activeStorage } from "@/lib/api/attachments"
import { isDesktop } from "@/lib/platform"

const urlCache = new Map<string, string>()
const cacheKey = (cardId: string, key: string) => `${cardId}:${key}`

/**
 * Resolves a viewable URL for an attachment key via the active storage backend
 * (an `/api/files` route). Returns null until resolved or when resolution fails.
 */
export function useAttachmentUrlByKey(
  cardId: string,
  key: string
): string | null {
  const [state, setState] = useState<{ key: string; url: string | null }>({
    key,
    url: null,
  })

  useEffect(() => {
    const ck = cacheKey(cardId, key)
    if (urlCache.has(ck)) return

    let alive = true
    const resolve = isDesktop()
      ? activeStorage()
          .get(cardId, key)
          .then((blob) => URL.createObjectURL(blob))
      : activeStorage().url(cardId, key)

    resolve
      .then((u) => {
        urlCache.set(ck, u)
        if (alive) setState({ key, url: u })
      })
      .catch(() => alive && setState({ key, url: null }))

    return () => {
      alive = false
    }
  }, [cardId, key])

  // Cache first so a remount has a URL on the first render; fall back to state,
  // guarded on `key` so a key change doesn't show the previous image.
  return (
    urlCache.get(cacheKey(cardId, key)) ??
    (state.key === key ? state.url : null)
  )
}

export function useAttachmentUrl(
  cardId: string,
  att: Attachment
): string | null {
  return useAttachmentUrlByKey(cardId, att.key)
}
