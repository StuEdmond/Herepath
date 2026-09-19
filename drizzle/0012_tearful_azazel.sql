CREATE TYPE "public"."condition_category" AS ENUM('closure', 'roadworks', 'surface', 'hazard', 'other');--> statement-breakpoint
CREATE TABLE "ride_condition_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" "trip_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"category" "condition_category" NOT NULL,
	"note" text NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "last_verified_on" date;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "conditions_note" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "conditions_note_on" date;--> statement-breakpoint
ALTER TABLE "day_rides" ADD COLUMN "last_verified_on" date;--> statement-breakpoint
ALTER TABLE "day_rides" ADD COLUMN "conditions_note" text;--> statement-breakpoint
ALTER TABLE "day_rides" ADD COLUMN "conditions_note_on" date;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "last_verified_on" date;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "conditions_note" text;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "conditions_note_on" date;--> statement-breakpoint
ALTER TABLE "ride_condition_reports" ADD CONSTRAINT "ride_condition_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;