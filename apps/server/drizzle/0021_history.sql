CREATE TABLE "history" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"seq" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "history_board_seq" ON "history" USING btree ("board_id","seq");