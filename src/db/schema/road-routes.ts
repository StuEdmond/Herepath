import { pgTable, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * A road route between two points, as the routing service answered it, kept so the same stretch is never paid for twice. `key` is a hash
 * of the provider and the two points (rounded to about 10 metres), so switching provider asks the new one.
 */
export const roadRouteCache = pgTable("road_route_cache", {
  key: text("key").primaryKey(),
  provider: text("provider").notNull(),
  line: jsonb("line").$type<[number, number][]>().notNull(),
  distanceMeters: integer("distance_meters").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});
