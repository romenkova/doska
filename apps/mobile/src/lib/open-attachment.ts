import { apiUrl, runtime, type Attachment } from "@doska/core"
import { Directory, File, Paths } from "expo-file-system"
import FileViewer from "react-native-file-viewer"

export async function openAttachment(attachment: Attachment): Promise<void> {
  const dir = new Directory(
    Paths.cache,
    "attachments",
    encodeURIComponent(attachment.key)
  )
  dir.create({ intermediates: true, idempotent: true })

  const token = runtime().auth.token()
  const file = await File.downloadFileAsync(
    apiUrl(`/api/files/${encodeURIComponent(attachment.key)}`),
    new File(dir, attachment.name),
    {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      idempotent: true,
    }
  )

  await FileViewer.open(file.uri, { displayName: attachment.name })
}
