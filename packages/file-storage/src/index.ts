export {
  extname,
  type FileInput,
  type FileStorage,
  type StoredFile,
} from "./file-storage"
export { S3FileStorage, type S3Deps } from "./adapters/s3"
export { FsFileStorage, type FsDeps, type FsPort } from "./adapters/fs"
