import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * OpenStreetMap's answer to one place lookup along one track, kept so riders never wait on the free service and so a scheduled
 * job can refresh old answers. `key` is a hash of the query that was asked, so a changed track asks a new question.
 */
export const osmPlaceCache = pgTable("osm_place_cache", {
  key: text("key").primaryKey(),
  elements: jsonb("elements").$type<unknown[]>().notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});
