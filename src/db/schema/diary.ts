import { pgTable, uuid, text, date, numeric, smallint, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tripTargetEnum } from "./enums-social";

export const diaryVisibilityEnum = pgEnum("diary_visibility", ["private", "shared"]);

export interface OwnRouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

/**
 * Either targetType/targetId point at a catalogue Route/DayRide/Tour, or
 * ownRouteName/ownRouteGeometry hold a rider's own uploaded GPX — never both.
 */
export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  targetType: tripTargetEnum("target_type"),
  targetId: uuid("target_id"),
  ownRouteName: text("own_route_name"),
  ownRouteGeometry: jsonb("own_route_geometry").$type<OwnRouteGeometry>(),

  date: date("date").notNull(),
  startTime: text("start_time"),
  finishTime: text("finish_time"),
  distanceMiles: numeric("distance_miles", { precision: 6, scale: 1 }).notNull(),

  rating: smallint("rating"),
  notes: text("notes"),
  weatherConditions: text("weather_conditions"),
  weatherTemperatureC: integer("weather_temperature_c"),
  bike: text("bike"),
  rodeSolo: boolean("rode_solo").notNull().default(true),
  rodeWithCount: integer("rode_with_count"),

  visibility: diaryVisibilityEnum("visibility").notNull().default("private"),
  suggestAsNewRoute: boolean("suggest_as_new_route").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const diaryEntryPhotos = pgTable("diary_entry_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  diaryEntryId: uuid("diary_entry_id")
    .notNull()
    .references(() => diaryEntries.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  mileMarker: numeric("mile_marker", { precision: 6, scale: 1 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
