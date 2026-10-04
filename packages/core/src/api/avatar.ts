import { authClient } from "./auth-client"
import { createStorage } from "./attachments/create-storage"

export async function setAvatar(file: File): Promise<void> {
  const { key } = await createStorage().put("avatar", {
    name: file.name,
    mime: file.type,
    bytes: file,
  })
  await saveImage(key)
}

export function removeAvatar(): Promise<void> {
  return saveImage(null)
}

async function saveImage(image: string | null): Promise<void> {
  const { error } = await authClient().updateUser({ image })
  if (error) throw new Error(error.message ?? "Could not save the avatar")
}
