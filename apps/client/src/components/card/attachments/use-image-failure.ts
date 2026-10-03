import { useState } from "react"
import {
  imageUnavailable,
  type AttachmentSource,
  useConnection,
  type Connection,
} from "@doska/core"

type Status = Connection["status"]

export function useImageFailure(
  src: string | null,
  source: AttachmentSource = "sync"
): { failed: boolean; onError: () => void } {
  const { status } = useConnection()
  const [failure, setFailure] = useState<{ src: string; at: Status } | null>(
    null
  )

  const failedAt = failure && failure.src === src ? failure.at : null

  return {
    failed: imageUnavailable({ source, hasUrl: !!src, failedAt, status }),
    onError: () => src && setFailure({ src, at: status }),
  }
}
