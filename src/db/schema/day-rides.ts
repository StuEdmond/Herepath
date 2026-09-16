import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, bikeTypeEnum, suitabilityLevelEnum, dayRideStageKindEnum, stopTypeEnum } from "./enums";
import { regions } from "./regions";
import { routes } from "./routes";
import { places } from "./places";

export const dayRides = pgTable("day_rides", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),

  introSell: text("intro_sell").notNull(),
  introCharacter: text("intro_character").notNull(),

  startLocation: text("start_location").notNull(),
  finishLocation: text("finish_location").notNull(),
  isLoop: boolean("is_loop").notNull().default(false),

  totalDistanceMiles: numeric("total_distance_miles", { precision: 6, scale: 1 }).notNull(),
  ridingTimeMinutes: integer("riding_time_minutes").notNull(),
  /** e.g. "5 to 6 hours" */
  fullDayTimeEstimate: text("full_day_time_estimate").notNull(),

  bestTime: text("best_time"),
  parkingNote: text("parking_note"),

  /** Full ride track as GeoJSON */
  geometry: jsonb("geometry").$type<GeoJSON.GeoJSON>(),

  heroImage: text("hero_image"),
  isSample: boolean("is_sample").notNull().default(false),
  status: contentStatusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dayRideBikeSuitability = pgTable("day_ride_bike_suitability", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayRideId: uuid("day_ride_id")
    .notNull()
    .references(() => dayRides.id, { onDelete: "cascade" }),
  bikeType: bikeTypeEnum("bike_type").notNull(),
  level: suitabilityLevelEnum("level").notNull(),
  note: text("note"),
});

/**
 * One ordered list per day ride. Only the columns relevant to `kind` are
 * populated: start/finish use location+note; route uses routeId+fromMile+toMile;
 * link uses description+fromMile+toMile+note; stop uses placeId+mile+stopType.
 */
export const dayRideStages = pgTable("day_ride_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayRideId: uuid("day_ride_id")
    .notNull()
    .references(() => dayRides.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: dayRideStageKindEnum("kind").notNull(),

  location: text("location"),
  note: text("note"),

  routeId: uuid("route_id").references(() => routes.id),
  fromMile: numeric("from_mile", { precision: 6, scale: 1 }),
  toMile: numeric("to_mile", { precision: 6, scale: 1 }),

  description: text("description"),

  placeId: uuid("place_id").references(() => places.id),
  mile: numeric("mile", { precision: 6, scale: 1 }),
  stopType: stopTypeEnum("stop_type"),
});

export const dayRidePlacesToEat = pgTable("day_ride_places_to_eat", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayRideId: uuid("day_ride_id")
    .notNull()
    .references(() => dayRides.id, { onDelete: "cascade" }),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id),
  isSuggestedLunch: boolean("is_suggested_lunch").notNull().default(false),
});
