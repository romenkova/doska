ALTER TABLE "cards" ADD COLUMN "stamps" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "body_conflict" jsonb;--> statement-breakpoint
ALTER TABLE "columns" ADD COLUMN "stamps" jsonb DEFAULT '{}'::jsonb NOT NULL;