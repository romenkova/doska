import { getDocumentAsync } from "expo-document-picker"
import {
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from "expo-image-picker"
import type { LocalFile } from "./upload-files"

export async function pickImages(): Promise<LocalFile[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    // HEIC otherwise, which browsers can't draw.
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Compatible,
  })
  if (result.canceled) return []
  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mime: asset.mimeType ?? "image/jpeg",
  }))
}

export async function pickDocuments(): Promise<LocalFile[]> {
  const result = await getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
  })
  if (result.canceled) return []
  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.name,
    mime: asset.mimeType ?? "application/octet-stream",
  }))
}
