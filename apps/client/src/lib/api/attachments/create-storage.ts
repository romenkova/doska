import { S3FileStorage, type FileStorage } from "@doska/file-storage"
import { appFetch } from "../fetch"
import { apiUrl } from "../server"

/**
 * The backend attachments are read from and written to. Kept as a factory so a
 * second backend is a one-line change here rather than at every call site.
 */
export function createStorage(): FileStorage {
  return new S3FileStorage({ fetch: appFetch, apiUrl })
}

export const activeStorage = createStorage
