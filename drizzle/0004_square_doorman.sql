CREATE TYPE "public"."membership_tier" AS ENUM('free', 'premium');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "membership_tier" "membership_tier" DEFAULT 'free' NOT NULL;