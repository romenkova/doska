CREATE TABLE "sidebar_layouts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"seq" integer NOT NULL
);
