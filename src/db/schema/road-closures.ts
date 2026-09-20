import { pgTable, text, jsonb, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";

/**
 * A road closure reported by an official source (today National Highways: motorways and major A roads in England). Only closures where
 * the road itself is shut are kept, not lane closures. `lines` are the stretches of road it covers as [lng, lat] points, so it can be
 * matched to the rides that use that road; the bounding box lets a query skip closures nowhere near a ride.
 */
export const roadClosures = pgTable("road_closures", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  /** Road names such as "A14, M11", comma separated. */
  roads: text("roads").notNull(),
  /** The source's own sentence, for example "A38 northbound Cappers Lane to Hilliards Cross carriageway closure". */
  comment: text("comment").notNull(),
  /** Where it is, in words. */
  locationText: text("location_text").notNull().default(""),
  /** "active" (in force now), "planned" or "suspended" (scheduled but not in force at the moment). */
  status: text("status").notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  lines: jsonb("lines").$type<[number, number][][]>().notNull(),
  minLat: doublePrecision("min_lat").notNull(),
  maxLat: doublePrecision("max_lat").notNull(),
  minLng: doublePrecision("min_lng").notNull(),
  maxLng: doublePrecision("max_lng").notNull(),
  /** When the source last changed this record. */
  sourceUpdatedAt: timestamp("source_updated_at"),
  /** When we last saw it in the source's feed; closures that stop appearing are removed. */
  seenAt: timestamp("seen_at").notNull().defaultNow(),
});

/** One row per source: when it was last read, so the site knows when to read it again, and a lock so two visitors don't both do it. */
export const roadClosureSync = pgTable("road_closure_sync", {
  source: text("source").primaryKey(),
  fetchedAt: timestamp("fetched_at"),
  attemptedAt: timestamp("attempted_at"),
  lockedUntil: timestamp("locked_until"),
  closureCount: integer("closure_count").notNull().default(0),
  lastError: text("last_error"),
});
