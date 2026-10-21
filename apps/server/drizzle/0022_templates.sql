ALTER TABLE "cards" ADD COLUMN "template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "template" boolean DEFAULT false NOT NULL;
