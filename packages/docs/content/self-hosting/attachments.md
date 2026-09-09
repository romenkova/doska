---
title: Attachments
nav: Attachments
description: "Where card files are stored on a self-hosted Doska: the local volume, or S3-compatible buckets."
order: 3
updated: "2026-08-07"
---

Doska has two ways to store data: a **local volume**, or an **S3 bucket**.
When no S3 env variables are set, it uses a local volume by default.

The local volume is included in the [backup script](/self-hosting/backups).

## S3

| Variable                                      | What it does                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `S3_BUCKET`                                   | Bucket name                                          |
| `S3_REGION`                                   | Bucket region, e.g. `us-east-1`.                                                       |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credentials for a user or role with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`. |
| `S3_ENDPOINT`                                 | For S3-compatible stores,  MinIO, Cloudflare R2, etc.                           |

Uploads and downloads are proxied through the server,
so credentials never reach the browser.

## Size limit

`FILE_MAX_BYTES` caps a single upload, on either backend. It defaults to 25 MiB:

```sh
FILE_MAX_BYTES=26214400
```

## Which backend do I want?

The local volume needs no configuration, and
[`backup.sh`](/self-hosting/backups) archives it alongside the database
dump. Reach for S3 when you'd rather not size the host's disk around
attachments, or when you're running the server somewhere with ephemeral storage.
Note that `backup.sh` doesn't touch a bucket.
