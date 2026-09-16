import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  smallint,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, surfaceQualityEnum, bikeTypeEnum, suitabilityLevelEnum } from "./enums";
import { regions } from "./regions";
import { places } from "./places";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),

  /** First paragraph: sells the experience */
  introSell: text("intro_sell").notNull(),
  /** Second paragraph: practical character and honest warnings */
  introCharacter: text("intro_character").notNull(),

  distanceMiles: numeric("distance_miles", { precision: 6, scale: 1 }).notNull(),
  ridingTimeMinutes: integer("riding_time_minutes").notNull(),
  /** 1 (relaxed) to 5 (very challenging) */
  difficulty: smallint("difficulty").notNull(),
  surfaceQuality: surfaceQualityEnum("surface_quality").notNull(),

  hazards: text("hazards"),
  bestTime: text("best_time"),
  stopOffNote: text("stop_off_note"),

  /** Full track as a GeoJSON LineString/FeatureCollection */
  geometry: jsonb("geometry").$type<GeoJSON.GeoJSON>(),
  startPoint: jsonb("start_point").$type<GeoPoint>(),
  endPoint: jsonb("end_point").$type<GeoPoint>(),

  heroImage: text("hero_image"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),

  isSample: boolean("is_sample").notNull().default(false),
  status: contentStatusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const routeBikeSuitability = pgTable("route_bike_suitability", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: uuid("route_id")
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  bikeType: bikeTypeEnum("bike_type").notNull(),
  level: suitabilityLevelEnum("level").notNull(),
  note: text("note"),
});

export const routeFuelStops = pgTable("route_fuel_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: uuid("route_id")
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id),
  mileMarker: numeric("mile_marker", { precision: 6, scale: 1 }).notNull(),
});
