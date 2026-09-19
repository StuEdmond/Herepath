import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
  date,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, bikeTypeEnum, suitabilityLevelEnum } from "./enums";
import { regions } from "./regions";
import { dayRides } from "./day-rides";
import { places } from "./places";

export interface TourPlanningNotes {
  fuel?: string;
  weather?: string;
  luggage?: string;
  breakdownAndSignal?: string;
  gettingHome?: string;
}

export const tours = pgTable("tours", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),

  introSell: text("intro_sell").notNull(),
  introCharacter: text("intro_character").notNull(),

  durationDays: integer("duration_days").notNull(),
  totalDistanceMiles: numeric("total_distance_miles", { precision: 6, scale: 1 }).notNull(),
  averageDayMiles: numeric("average_day_miles", { precision: 6, scale: 1 }).notNull(),

  startLocation: text("start_location").notNull(),
  finishLocation: text("finish_location").notNull(),
  bestTime: text("best_time"),

  lastVerifiedOn: date("last_verified_on"),
  conditionsNote: text("conditions_note"),
  conditionsNoteOn: date("conditions_note_on"),

  planningNotes: jsonb("planning_notes").$type<TourPlanningNotes>(),

  heroImage: text("hero_image"),
  isSample: boolean("is_sample").notNull().default(false),
  status: contentStatusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tourRegions = pgTable(
  "tour_regions",
  {
    tourId: uuid("tour_id")
      .notNull()
      .references(() => tours.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
  },
  (t) => [primaryKey({ columns: [t.tourId, t.regionId] })],
);

export const tourBikeSuitability = pgTable("tour_bike_suitability", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  bikeType: bikeTypeEnum("bike_type").notNull(),
  level: suitabilityLevelEnum("level").notNull(),
  note: text("note"),
});

export const tourDays = pgTable("tour_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  dayRideId: uuid("day_ride_id")
    .notNull()
    .references(() => dayRides.id),
  overnightLocation: text("overnight_location").notNull(),
  fuelWarning: text("fuel_warning"),
});

/** Accommodation options for a given night of the tour (dayNumber = night after that day) */
export const tourOvernightStays = pgTable("tour_overnight_stays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id),
});

/** e.g. "Shorter version", "Reverse direction", "With rest day" */
export const tourVariations = pgTable("tour_variations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  relatedTourId: uuid("related_tour_id")
    .notNull()
    .references(() => tours.id),
  label: text("label").notNull(),
});
