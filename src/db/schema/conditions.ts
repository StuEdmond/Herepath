import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tripTargetEnum } from "./enums-social";

export const conditionCategoryEnum = pgEnum("condition_category", ["closure", "roadworks", "surface", "hazard", "other"]);

/**
 * A rider telling us a road has changed (a closure, roadworks, a new surface problem). It goes to admin, who check it and, if it
 * holds up, put a dated conditions note on the ride. Reports are never shown to other riders directly.
 */
export const rideConditionReports = pgTable("ride_condition_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: tripTargetEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  category: conditionCategoryEnum("category").notNull(),
  note: text("note").notNull(),
  /** Set when an admin has dealt with it. */
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
