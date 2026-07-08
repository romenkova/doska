import { createContext, useContext } from "react"
import type {
  useAttachmentUpload,
  PendingUpload,
} from "./use-attachment-upload"

export type UploadApi = ReturnType<typeof useAttachmentUpload>

export const UploadCtx = createContext<UploadApi | null>(null)

/** For upload controls; must be rendered inside `AttachmentUploadProvider`. */
export function useUploads(): UploadApi {
  const ctx = useContext(UploadCtx)
  if (!ctx)
    throw new Error("useUploads must be used within AttachmentUploadProvider")
  return ctx
}

/** Pending uploads for the list; safe to read outside a provider (returns []). */
export function usePendingUploads(): PendingUpload[] {
  return useContext(UploadCtx)?.pending ?? []
}
