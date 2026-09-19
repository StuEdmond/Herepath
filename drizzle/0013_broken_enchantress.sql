ALTER TABLE "routes" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "source_author" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "source_licence" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "needs_review" boolean DEFAULT false NOT NULL;