import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

/** One route in a saved trip, in riding order. `reversed` means ridden from its finish back to its start. */
export interface SavedTripItem {
  routeId: string;
  reversed: boolean;
}

/** A trip a rider built in the trip planner from Herepath routes. Private to the rider. */
export const savedTrips = pgTable("saved_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  items: jsonb("items").$type<SavedTripItem[]>().notNull(),
  /** Days are split at about this many miles; null means one day. */
  milesPerDay: integer("miles_per_day"),
  /** Where a round trip starts and finishes; null for a trip that runs from its first route to its last. */
  origin: jsonb("origin").$type<{ lat: number; lng: number }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
