CREATE TABLE "place_review_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_review_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "place_review_reports_once" UNIQUE("place_review_id","reporter_id")
);
--> statement-breakpoint
ALTER TABLE "place_review_reports" ADD CONSTRAINT "place_review_reports_place_review_id_place_reviews_id_fk" FOREIGN KEY ("place_review_id") REFERENCES "public"."place_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_review_reports" ADD CONSTRAINT "place_review_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;