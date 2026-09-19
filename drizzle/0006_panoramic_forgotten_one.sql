CREATE TABLE "place_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"place_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "place_reviews_user_place" UNIQUE("user_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "advice_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"cover_image" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advice_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;