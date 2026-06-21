CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"column_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"position" text NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"seq" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "columns" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"title" text NOT NULL,
	"position" text NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"seq" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"id" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"position" text NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"seq" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cards_board_seq" ON "cards" USING btree ("board_id","seq");--> statement-breakpoint
CREATE INDEX "columns_board_seq" ON "columns" USING btree ("board_id","seq");