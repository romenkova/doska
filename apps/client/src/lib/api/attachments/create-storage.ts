import {
  FsFileStorage,
  S3FileStorage,
  type FileStorage,
} from "@doska/file-storage"
import { apiUrl, appFetch, getSyncFolder, getSyncTarget } from "../runtime"
import type { SyncTarget } from "../runtime"
import * as fsAdapter from "../sync/fs/fs-adapter"
import { assetsRel } from "../sync/fs/fs-store"
import { loadPathIndex } from "../sync/fs/path-index"

/** Absolute path of a card's `.assets` sidecar, from the persisted path-index. */
async function resolveAssetsDir(cardId: string): Promise<string | null> {
  const root = getSyncFolder()
  if (!root) return null
  const index = await loadPathIndex()
  const cardRel = index[cardId]
  if (!cardRel) return null
  const rel = assetsRel(cardRel)
  return fsAdapter.join(root, ...rel.split("/"))
}

/** Builds the storage backend for an explicit sync target (used for migration). */
export function createStorage(target: SyncTarget): FileStorage {
  if (target === "folder")
    return new FsFileStorage({
      fs: {
        join: fsAdapter.join,
        mkdir: fsAdapter.mkdir,
        writeFile: fsAdapter.writeFile,
        readFile: fsAdapter.readFile,
        remove: fsAdapter.remove,
      },
      resolveAssetsDir,
      toAssetUrl: fsAdapter.toAssetUrl,
      newKey: () => crypto.randomUUID(),
    })
  return new S3FileStorage({ fetch: appFetch, apiUrl })
}

/** The storage backend for the current sync target. */
export function activeStorage(): FileStorage {
  return createStorage(getSyncTarget())
}
