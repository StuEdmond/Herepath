CREATE TABLE "osm_place_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"elements" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
