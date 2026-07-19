// Runs before any app module loads, so env is in place when `auth/index.ts`
// reads AUTH_SECRET and `get-db.ts` reads DATABASE_URL at import time.

// Force the in-memory PGlite path and the file-storage-off path, whatever the
// shell or a stray .env has set.
delete process.env.DATABASE_URL
delete process.env.DB_FILE
delete process.env.BASE_URL
delete process.env.S3_BUCKET

process.env.AUTH_SECRET ??= "test-secret"
process.env.AUTH_LOGIN ??= "tester"
process.env.AUTH_PASSWORD ??= "test-password"
// The per-route limiter buckets by IP; inject reuses one, so leave it off or the
// suite trips its own rate limit.
process.env.AUTH_RATE_LIMIT = "off"
