CREATE TYPE "public"."trip_target" AS ENUM('route', 'day_ride', 'tour');--> statement-breakpoint
CREATE TYPE "public"."diary_visibility" AS ENUM('private', 'shared');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password_hash" text,
	"main_bike" text,
	"member_since" timestamp DEFAULT now() NOT NULL,
	"privacy_settings" jsonb,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "trip_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"text" text,
	"bike_ridden" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_rides" (
	"user_id" text NOT NULL,
	"target_type" "trip_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_rides_user_id_target_type_target_id_pk" PRIMARY KEY("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "diary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "trip_target",
	"target_id" uuid,
	"own_route_name" text,
	"own_route_geometry" jsonb,
	"date" date NOT NULL,
	"start_time" text,
	"finish_time" text,
	"distance_miles" numeric(6, 1) NOT NULL,
	"rating" smallint,
	"notes" text,
	"weather_conditions" text,
	"weather_temperature_c" integer,
	"bike" text,
	"rode_solo" boolean DEFAULT true NOT NULL,
	"rode_with_count" integer,
	"visibility" "diary_visibility" DEFAULT 'private' NOT NULL,
	"suggest_as_new_route" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_entry_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_entry_id" uuid NOT NULL,
	"url" text NOT NULL,
	"mile_marker" numeric(6, 1),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_rides" ADD CONSTRAINT "saved_rides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entry_photos" ADD CONSTRAINT "diary_entry_photos_diary_entry_id_diary_entries_id_fk" FOREIGN KEY ("diary_entry_id") REFERENCES "public"."diary_entries"("id") ON DELETE cascade ON UPDATE no action;