CREATE TABLE "road_route_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"line" jsonb NOT NULL,
	"distance_meters" integer NOT NULL,
	"duration_seconds" integer NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
