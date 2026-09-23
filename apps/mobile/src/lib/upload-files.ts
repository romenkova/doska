import { runtime } from "@doska/core/runtime"
import { apiUrl } from "@doska/core/server"
import type { Attachment } from "@doska/core/types"
import { toAttachmentSrc } from "@doska/markdown"
import { File } from "expo-file-system"
import { v4 as uuid } from "uuid"

/** A file on the device, as the pickers and the share intent hand it over. */
export interface LocalFile {
  uri: string
  name: string
  mime: string
}

/** Puts each file on the server. Saving the records onto the card is the caller's job. */
export async function uploadFiles(files: LocalFile[]): Promise<Attachment[]> {
  const token = runtime().auth.token()
  const added: Attachment[] = []
  for (const file of files) {
    // Not fetch: its blob bodies reached the server without the octet-stream type (415).
    const res = await new File(file.uri).upload(apiUrl("/api/files"), {
      sessionType: "foreground",
      headers: {
        "content-type": "application/octet-stream",
        "x-file-name": encodeURIComponent(file.name),
        "x-file-mime": file.mime,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`upload failed: ${res.status}`)
    }
    const stored = JSON.parse(res.body) as Pick<Attachment, "key" | "mime" | "size">
    added.push({
      id: uuid(),
      name: file.name,
      key: stored.key,
      mime: stored.mime,
      size: stored.size,
    })
  }
  return added
}

export function isImage(attachment: Attachment): boolean {
  return attachment.mime.startsWith("image/")
}

export function imageMarkdown(attachment: Attachment): string {
  // `$` marks the caret in an editor insert, brackets would end the alt text.
  const alt = attachment.name.replace(/[$[\]]/g, "")
  return `![${alt}](${toAttachmentSrc(attachment.key)})`
}
