ALTER TABLE "cards" ADD COLUMN "number" integer;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "prefix" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Best-effort prefix for boards created before card ids. Not guaranteed unique;
-- a client backfills empties with a deduped value, and new boards enforce it.
UPDATE "dashboards" SET "prefix" = UPPER(LEFT(regexp_replace("title", '[^A-Za-z0-9]', '', 'g'), 4)) WHERE "prefix" = '';