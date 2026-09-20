CREATE TABLE "road_closure_sync" (
	"source" text PRIMARY KEY NOT NULL,
	"fetched_at" timestamp,
	"attempted_at" timestamp,
	"locked_until" timestamp,
	"closure_count" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "road_closures" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"roads" text NOT NULL,
	"comment" text NOT NULL,
	"location_text" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"lines" jsonb NOT NULL,
	"min_lat" double precision NOT NULL,
	"max_lat" double precision NOT NULL,
	"min_lng" double precision NOT NULL,
	"max_lng" double precision NOT NULL,
	"source_updated_at" timestamp,
	"seen_at" timestamp DEFAULT now() NOT NULL
);
