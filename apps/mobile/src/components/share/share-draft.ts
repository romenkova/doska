import type { ShareIntent } from "expo-share-intent"
import type { LocalFile } from "@/lib/upload-files"

export interface ShareDraft {
  title: string
  body: string
  files: LocalFile[]
}

export function toShareDraft(intent: ShareIntent): ShareDraft {
  const files = (intent.files ?? []).map((file) => ({
    uri: file.path,
    name: file.fileName,
    mime: file.mimeType || "application/octet-stream",
  }))
  const text = intent.text?.trim() ?? ""

  if (intent.webUrl) {
    return {
      title: intent.meta?.title || intent.webUrl,
      body: text || intent.webUrl,
      files,
    }
  }

  if (text) {
    const [first, ...rest] = text.split("\n")
    return { title: first.trim(), body: rest.join("\n").trim(), files }
  }

  return { title: "", body: "", files }
}
