CREATE TYPE "public"."bike_type" AS ENUM('sports', 'naked_and_roadster', 'adventure', 'touring', 'cruiser', '125cc_and_new_riders');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."day_ride_stage_kind" AS ENUM('start', 'route', 'link', 'stop', 'finish');--> statement-breakpoint
CREATE TYPE "public"."landmark_type" AS ENUM('castle', 'reservoir', 'pass', 'viaduct', 'viewpoint', 'coast', 'village', 'other');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('cafe', 'pub', 'restaurant', 'fuel', 'hotel', 'b_and_b', 'campsite');--> statement-breakpoint
CREATE TYPE "public"."stop_type" AS ENUM('lunch', 'coffee', 'fuel');--> statement-breakpoint
CREATE TYPE "public"."suitability_level" AS ENUM('suited', 'caution');--> statement-breakpoint
CREATE TYPE "public"."surface_quality" AS ENUM('good', 'mixed', 'poor');--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "landmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "landmark_type" NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"region_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landmarks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "route_landmarks" (
	"route_id" uuid NOT NULL,
	"landmark_id" uuid NOT NULL,
	CONSTRAINT "route_landmarks_route_id_landmark_id_pk" PRIMARY KEY("route_id","landmark_id")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "place_type" NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"address" text,
	"website_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_band" smallint,
	"short_description" text,
	"photo" text,
	"is_suggested" boolean DEFAULT false NOT NULL,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_bike_suitability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"bike_type" "bike_type" NOT NULL,
	"level" "suitability_level" NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "route_fuel_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"mile_marker" numeric(6, 1) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region_id" uuid NOT NULL,
	"intro_sell" text NOT NULL,
	"intro_character" text NOT NULL,
	"distance_miles" numeric(6, 1) NOT NULL,
	"riding_time_minutes" integer NOT NULL,
	"difficulty" smallint NOT NULL,
	"surface_quality" "surface_quality" NOT NULL,
	"hazards" text,
	"best_time" text,
	"stop_off_note" text,
	"geometry" jsonb,
	"start_point" jsonb,
	"end_point" jsonb,
	"hero_image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "routes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "day_ride_bike_suitability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_ride_id" uuid NOT NULL,
	"bike_type" "bike_type" NOT NULL,
	"level" "suitability_level" NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "day_ride_places_to_eat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_ride_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"is_suggested_lunch" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "day_ride_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_ride_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" "day_ride_stage_kind" NOT NULL,
	"location" text,
	"note" text,
	"route_id" uuid,
	"from_mile" numeric(6, 1),
	"to_mile" numeric(6, 1),
	"description" text,
	"place_id" uuid,
	"mile" numeric(6, 1),
	"stop_type" "stop_type"
);
--> statement-breakpoint
CREATE TABLE "day_rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region_id" uuid NOT NULL,
	"intro_sell" text NOT NULL,
	"intro_character" text NOT NULL,
	"start_location" text NOT NULL,
	"finish_location" text NOT NULL,
	"is_loop" boolean DEFAULT false NOT NULL,
	"total_distance_miles" numeric(6, 1) NOT NULL,
	"riding_time_minutes" integer NOT NULL,
	"full_day_time_estimate" text NOT NULL,
	"best_time" text,
	"parking_note" text,
	"geometry" jsonb,
	"hero_image" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "day_rides_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tour_bike_suitability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"bike_type" "bike_type" NOT NULL,
	"level" "suitability_level" NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "tour_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"day_ride_id" uuid NOT NULL,
	"overnight_location" text NOT NULL,
	"fuel_warning" text
);
--> statement-breakpoint
CREATE TABLE "tour_overnight_stays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"place_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tour_regions" (
	"tour_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	CONSTRAINT "tour_regions_tour_id_region_id_pk" PRIMARY KEY("tour_id","region_id")
);
--> statement-breakpoint
CREATE TABLE "tour_variations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"related_tour_id" uuid NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"intro_sell" text NOT NULL,
	"intro_character" text NOT NULL,
	"duration_days" integer NOT NULL,
	"total_distance_miles" numeric(6, 1) NOT NULL,
	"average_day_miles" numeric(6, 1) NOT NULL,
	"start_location" text NOT NULL,
	"finish_location" text NOT NULL,
	"best_time" text,
	"planning_notes" jsonb,
	"hero_image" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tours_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_routes" (
	"collection_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "collection_routes_collection_id_route_id_pk" PRIMARY KEY("collection_id","route_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "landmarks" ADD CONSTRAINT "landmarks_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_landmarks" ADD CONSTRAINT "route_landmarks_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_landmarks" ADD CONSTRAINT "route_landmarks_landmark_id_landmarks_id_fk" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_bike_suitability" ADD CONSTRAINT "route_bike_suitability_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_fuel_stops" ADD CONSTRAINT "route_fuel_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_fuel_stops" ADD CONSTRAINT "route_fuel_stops_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_bike_suitability" ADD CONSTRAINT "day_ride_bike_suitability_day_ride_id_day_rides_id_fk" FOREIGN KEY ("day_ride_id") REFERENCES "public"."day_rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_places_to_eat" ADD CONSTRAINT "day_ride_places_to_eat_day_ride_id_day_rides_id_fk" FOREIGN KEY ("day_ride_id") REFERENCES "public"."day_rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_places_to_eat" ADD CONSTRAINT "day_ride_places_to_eat_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_stages" ADD CONSTRAINT "day_ride_stages_day_ride_id_day_rides_id_fk" FOREIGN KEY ("day_ride_id") REFERENCES "public"."day_rides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_stages" ADD CONSTRAINT "day_ride_stages_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_ride_stages" ADD CONSTRAINT "day_ride_stages_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_rides" ADD CONSTRAINT "day_rides_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_bike_suitability" ADD CONSTRAINT "tour_bike_suitability_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_days" ADD CONSTRAINT "tour_days_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_days" ADD CONSTRAINT "tour_days_day_ride_id_day_rides_id_fk" FOREIGN KEY ("day_ride_id") REFERENCES "public"."day_rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_overnight_stays" ADD CONSTRAINT "tour_overnight_stays_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_overnight_stays" ADD CONSTRAINT "tour_overnight_stays_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_regions" ADD CONSTRAINT "tour_regions_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_regions" ADD CONSTRAINT "tour_regions_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_variations" ADD CONSTRAINT "tour_variations_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_variations" ADD CONSTRAINT "tour_variations_related_tour_id_tours_id_fk" FOREIGN KEY ("related_tour_id") REFERENCES "public"."tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_routes" ADD CONSTRAINT "collection_routes_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_routes" ADD CONSTRAINT "collection_routes_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;