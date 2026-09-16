import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

/** "Popular" quick-search chips on the Explore page (Section 5.1), editable by admin. */
export const searchChips = pgTable("search_chips", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  query: text("query").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
