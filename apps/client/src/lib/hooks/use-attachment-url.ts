import { useEffect, useState } from "react"
import type { Attachment } from "@/lib/types"
import { activeStorage } from "@/lib/api/attachments"

/**
 * Resolves a viewable URL for an attachment key via the active storage backend
 * (an `/api/files` route). Returns null until resolved or when resolution fails.
 */
export function useAttachmentUrlByKey(
  cardId: string,
  key: string
): string | null {
  // Keyed on the attachment key so a key change resets the URL during render
  // (no stale image), without a synchronous setState in the effect.
  const [state, setState] = useState<{ key: string; url: string | null }>({
    key,
    url: null,
  })

  useEffect(() => {
    let alive = true
    activeStorage()
      .url(cardId, key)
      .then((u) => alive && setState({ key, url: u }))
      .catch(() => alive && setState({ key, url: null }))
    return () => {
      alive = false
    }
  }, [cardId, key])

  return state.key === key ? state.url : null
}

export function useAttachmentUrl(
  cardId: string,
  att: Attachment
): string | null {
  return useAttachmentUrlByKey(cardId, att.key)
}
