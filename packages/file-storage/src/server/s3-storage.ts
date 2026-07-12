import { randomUUID } from "node:crypto"
import type { Readable } from "node:stream"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { extname } from "../file-storage"
import { dispositionFor, resolveType, safeMime } from "./content-type"

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024

export interface S3StorageConfig {
  bucket: string
  /** Bucket region (default `us-east-1`). */
  region?: string
  /** Override for S3-compatible stores (MinIO, R2, …). */
  endpoint?: string
  /** Upload size cap in bytes (default 25 MiB). */
  maxBytes?: number
}

/** Result of storing bytes: the opaque key plus the sanitized metadata. */
export interface PutResult {
  key: string
  mime: string
  size: number
}

/** A fetched object ready to stream back, with the serve policy applied. */
export interface FetchedFile {
  body: Readable
  contentType: string
  contentLength?: number
  disposition: "inline" | "attachment"
}

/** Strict extension for a stored key: a plain lowercase `.xxx` suffix, or "". */
function keySuffix(name: string): string {
  const ext = extname(name)
  // Reject anything path-ish; keep it a plain suffix.
  return /^\.[a-z0-9]+$/.test(ext) ? ext : ""
}

/**
 * S3-backed attachment storage.
 */
export class S3ServerStorage {
  readonly maxBytes: number
  private readonly bucket: string
  private readonly client: S3Client

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket
    this.maxBytes = config.maxBytes ?? DEFAULT_MAX_BYTES
    this.client = new S3Client({
      region: config.region ?? "us-east-1",
      endpoint: config.endpoint,
      // `forcePathStyle` keeps S3-compatible endpoints (MinIO/R2) working.
      forcePathStyle: Boolean(config.endpoint),
    })
  }

  /** Stores `bytes` under a fresh random key; `name` only supplies the extension. */
  async put(
    bytes: Buffer,
    meta: { name: string; mime: string | string[] | undefined }
  ): Promise<PutResult> {
    const mime = safeMime(meta.mime)
    const key = `att/${randomUUID()}${keySuffix(meta.name)}`
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: mime,
        ContentLength: bytes.length,
      })
    )
    return { key, mime, size: bytes.length }
  }

  /** Fetches an object and resolves how it should be served. Throws if missing. */
  async fetch(key: string): Promise<FetchedFile> {
    const obj = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    )
    const contentType = resolveType(key, obj.ContentType)
    return {
      body: obj.Body as Readable,
      contentType,
      contentLength: obj.ContentLength ?? undefined,
      disposition: dispositionFor(contentType),
    }
  }

  async remove(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    )
  }
}

/**
 * Builds a storage instance from environment variables, or `null` when no
 * bucket is configured (the feature stays off). Reads `S3_BUCKET`, `S3_REGION`,
 * `S3_ENDPOINT`, `FILE_MAX_BYTES`; AWS credentials come from the SDK default
 * chain (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
 */
export function s3StorageFromEnv(
  env: NodeJS.ProcessEnv = process.env
): S3ServerStorage | null {
  const bucket = env.S3_BUCKET
  if (!bucket) return null
  return new S3ServerStorage({
    bucket,
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    maxBytes: Number(env.FILE_MAX_BYTES) || undefined,
  })
}
