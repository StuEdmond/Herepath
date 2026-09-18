import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Admin-edited overrides for page copy and images. A missing row means "use the default in src/lib/site-content.ts". */
export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
