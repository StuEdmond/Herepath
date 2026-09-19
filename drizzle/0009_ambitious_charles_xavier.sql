CREATE TYPE "public"."advertising_enquiry_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TABLE "advertising_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"business_type" text NOT NULL,
	"website" text,
	"message" text NOT NULL,
	"status" "advertising_enquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
